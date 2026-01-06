import { randomInt } from 'node:crypto'
import type { H3Event } from 'h3'
import pino from 'pino'
import z from 'zod/v4'
import type { StreamLogLevel, StreamMessage } from '../../shared/taskStream.types'

export interface TaskStreamLogMeta {
  [key: string]: any
}

export interface ParentLogFn {
  (meta: object, message?: string): void
  (message: string): void
}

export interface TaskStreamLogFn {
  (meta: TaskStreamLogMeta, message?: string): void
  (message: string): void
}

export interface ParentLogger {
  info: ParentLogFn
  warn: ParentLogFn
  error: ParentLogFn
  debug: ParentLogFn
}

// Need to make it similar to pino logger
export interface TaskStreamLogger {
  info: TaskStreamLogFn
  warn: TaskStreamLogFn
  error: TaskStreamLogFn
  debug: TaskStreamLogFn
}

export interface TaskStreamCheckpoint<T = unknown> {
  get: () => Promise<T | null>
  set: (value: T) => Promise<void>
}

export interface TaskStreamState {
  progress: (value: number) => void
  complete: (message?: string) => Promise<void>
  fail: (error: unknown, message?: string) => Promise<void>
}

export interface TaskStreamCancellation {
  isCancelled: () => boolean
  throwIfCancelled: () => void
}

export interface TaskStream<T = unknown> {
  stream: ReadableStream<Uint8Array>
  logger: TaskStreamLogger
  /** AbortSignal that triggers when client disconnects */
  signal: AbortSignal
  state: TaskStreamState
  cancellation: TaskStreamCancellation
  checkpoint: TaskStreamCheckpoint<T>
}

export type TaskStreamData<T = unknown> = {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'aborted'
  checkpoint: T | null
  updatedAt: number
}

export interface TaskStreamOptions {
  parentLogger?: ParentLogger
  clientLogLevel?: StreamLogLevel
}

export type TaskStreamOutput =
  | { kind: 'stream', stream: ReadableStream }
  | { kind: 'completed' }
  | { kind: 'aborted' }

const LOG_LEVEL: Record<StreamLogLevel, number> = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
}

interface TaskRepository {
  get: (id: string) => Promise<TaskStreamData | null>
  set: (id: string, task: TaskStreamData) => Promise<void>
  delete: (id: string) => Promise<void>
  cleanup: () => Promise<void>
}

interface InMemoryTaskRepositoryOptions {
  cleanupInterval?: number
  taskTTLSeconds?: number
  failedTaskTTLSeconds?: number
}

class InMemoryTaskRepository implements TaskRepository {
  private store = new Map<string, TaskStreamData>()
  private cleanupInterval: number
  private taskTTLSeconds: number
  private failedTaskTTLSeconds: number

  constructor(
    options?: InMemoryTaskRepositoryOptions,
  ) {
    this.cleanupInterval = options?.cleanupInterval ?? 60 * 1000
    this.taskTTLSeconds = options?.taskTTLSeconds ?? 3600
    this.failedTaskTTLSeconds = options?.failedTaskTTLSeconds ?? 300
    setInterval(() => this.cleanup(), this.cleanupInterval).unref()
  }

  async get<T>(id: string): Promise<TaskStreamData<T> | null> {
    const task = this.store.get(id) as TaskStreamData<T> | undefined
    if (task && this.isExpired(task)) {
      this.store.delete(id)
      return null
    }
    return task || null
  }

  async set(id: string, task: TaskStreamData): Promise<void> {
    task.updatedAt = Date.now()
    this.store.set(id, task)
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id)
  }

  async cleanup(): Promise<void> {
    for (const [id, task] of this.store.entries()) {
      if (this.isExpired(task)) {
        this.store.delete(id)
      }
    }
  }

  private isExpired(task: TaskStreamData): boolean {
    if (task.status === 'completed' || task.status === 'aborted') {
      return true
    } else if (task.status === 'failed') {
      const now = Date.now()
      if (now - task.updatedAt > this.failedTaskTTLSeconds * 1000) {
        return true
      }
    } else {
      const now = Date.now()
      if (now - task.updatedAt > this.taskTTLSeconds * 1000) {
        return true
      }
    }
    return false
  }
}

const taskStore = new InMemoryTaskRepository()
const defaultLogger = pino({ level: 'warn' })

const querySchema = z.object({
  taskId: z.string().optional(),
  action: z.enum(['retry', 'abort']).optional(),
})

export class ClientCancelledError extends Error {}

/**
 * Task Manager - Handles all task persistence and lifecycle management
 */
class TaskManager<T = unknown> {
  constructor(private store: TaskRepository) {}

  async getOrCreate(taskId?: string): Promise<TaskStreamData<T>> {
    const task = taskId ? (await this.store.get(taskId) as TaskStreamData<T> | null) : null
    return task || {
      id: taskId || randomId(),
      status: 'pending',
      checkpoint: null,
      updatedAt: Date.now(),
    } as TaskStreamData<T>
  }

  async setRunning(taskId: string): Promise<void> {
    const task = await this.store.get(taskId)
    if (task) {
      task.status = 'running'
      await this.store.set(taskId, task)
    }
  }

  async setCompleted(taskId: string): Promise<void> {
    const task = await this.store.get(taskId)
    if (task) {
      task.status = 'completed'
      await this.store.set(taskId, task)
    }
  }

  async setFailed(taskId: string): Promise<void> {
    const task = await this.store.get(taskId)
    if (task) {
      task.status = 'failed'
      await this.store.set(taskId, task)
    }
  }

  async setAborted(taskId: string): Promise<void> {
    const task = await this.store.get(taskId)
    if (task) {
      task.status = 'aborted'
      await this.store.set(taskId, task)
    }
  }

  async getCheckpoint(taskId: string): Promise<T | null> {
    const task = await this.store.get(taskId) as TaskStreamData<T> | null
    return (task?.checkpoint as T) ?? null
  }

  async setCheckpoint(taskId: string, data: T): Promise<void> {
    const task = await this.store.get(taskId)
    if (task) {
      task.checkpoint = data
      await this.store.set(taskId, task)
    }
  }
}

/**
 * Stream Manager - Handles SSE stream creation and message sending
 */
class StreamManager {
  private encoder = new TextEncoder()
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null
  private isClosed = false
  private abortController = new AbortController()
  public readonly stream: ReadableStream<Uint8Array>

  constructor(
    event: H3Event,
    private parentLogger: ParentLogger,
    private clientLogLevel: StreamLogLevel,
  ) {
    this.stream = new ReadableStream<Uint8Array>({
      start: (ctrl) => {
        this.controller = ctrl
      },
      cancel: () => {
        this.isClosed = true
        this.abortController.abort()
      },
    })

    // Listen for client disconnect
    if (event.node?.req) {
      event.node.req.on('close', () => {
        this.isClosed = true
        this.abortController.abort()
      })
    }

    // Set SSE headers
    setResponseHeaders(event, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })
  }

  send(data: StreamMessage): void {
    if (this.isClosed || !this.controller) {
      if (import.meta.dev) {
        this.parentLogger.warn('Attempted to send message on closed stream')
      }
      return
    }

    // Only send logs that meet the client log level
    if (data.type === 'log' && LOG_LEVEL[data.level] < LOG_LEVEL[this.clientLogLevel])
      return

    try {
      const message = `data: ${JSON.stringify(data)}\n\n`
      this.controller.enqueue(this.encoder.encode(message))
    } catch (e) {
      this.parentLogger.error({ error: e }, 'Failed to send SSE message')
      this.isClosed = true
    }
  }

  close(): void {
    if (!this.isClosed && this.controller) {
      try {
        this.controller.close()
      } catch (e) {
        // Already closed
      }
      this.isClosed = true
    }
  }

  createLogger(): TaskStreamLogger {
    const createLogMethod = (level: StreamLogLevel) => {
      return (metaOrMessage: TaskStreamLogMeta | string, message?: string) => {
        if (typeof metaOrMessage === 'string') {
          this.parentLogger[level](metaOrMessage)
          this.send({ type: 'log', level, message: metaOrMessage })
        } else {
          const { progress, error, ...rest } = metaOrMessage
          this.parentLogger[level](rest, message)
          this.send({
            type: 'log',
            level,
            message: message || '',
            progress,
            meta: Object.keys(rest).length > 0 ? rest : undefined,
          })
        }
      }
    }

    return {
      info: createLogMethod('info'),
      warn: createLogMethod('warn'),
      error: createLogMethod('error'),
      debug: createLogMethod('debug'),
    }
  }

  getSignal(): AbortSignal {
    return this.abortController.signal
  }

  isCancelled(): boolean {
    return this.isClosed
  }

  throwIfCancelled(): void {
    if (this.isClosed)
      throw new ClientCancelledError('Task cancelled by client')
  }
}

/**
 * Create task stream with given handler. Task state is fetched via `taskId` query parameter.
 *
 * @returns TaskStreamOutput based on task state
 *
 * - If task is already running, throws 409 error
 * - If task was completed, returns `{ kind: 'completed' }`
 * - If task was aborted, returns `{ kind: 'aborted' }`
 *
 * Otherwise, returns `{ kind: 'stream', stream: ReadableStream }`
 */
export async function createTaskStream<T>(
  event: H3Event,
  handler: (ctx: Omit<TaskStream<T>, 'stream'>) => Promise<void>,
  options?: TaskStreamOptions,
): Promise<TaskStreamOutput> {
  // Parse and validate query parameters
  const query = querySchema.safeParse(getQuery(event))
  if (!query.success) {
    throw createError({
      status: 400,
      message: 'Invalid task query parameters',
    })
  }
  const { taskId, action } = query.data

  // Initialize managers
  const taskManager = new TaskManager<T>(taskStore)
  const task = await taskManager.getOrCreate(taskId)

  // Handle task state checks
  if (task.status === 'running') {
    throw createError({
      status: 409,
      message: 'Task is already running',
    })
  }
  if (task.status === 'completed') {
    return { kind: 'completed' }
  }
  if (task.status === 'aborted') {
    return { kind: 'aborted' }
  }

  // Handle abort action on failed task
  if (task.status === 'failed' && action === 'abort') {
    await taskManager.setAborted(task.id)
    return { kind: 'aborted' }
  }

  // Create stream manager
  const {
    parentLogger = defaultLogger,
    clientLogLevel = 'info',
  } = options || {}
  const streamManager = new StreamManager(event, parentLogger, clientLogLevel)

  let isFinalized = false
  // Create context for consumer
  const ctx: Omit<TaskStream<T>, 'stream'> = {
    logger: streamManager.createLogger(),
    signal: streamManager.getSignal(),
    state: {
      progress: (value: number) => {
        streamManager.send({ type: 'progress', progress: value })
      },
      complete: async (message) => {
        if (isFinalized)
          return
        isFinalized = true
        await taskManager.setCompleted(task.id)
        streamManager.send({ type: 'complete', message })
        streamManager.close()
      },
      fail: async (error, message) => {
        if (isFinalized)
          return
        isFinalized = true
        const errorMessage = message || (error instanceof Error ? error.message : String(error))
        await taskManager.setFailed(task.id)
        streamManager.send({ type: 'fail', message: errorMessage })
        streamManager.close()
      },
    },
    cancellation: {
      isCancelled: () => streamManager.isCancelled(),
      throwIfCancelled: () => streamManager.throwIfCancelled(),
    },
    checkpoint: {
      get: () => taskManager.getCheckpoint(task.id),
      set: (value: T) => taskManager.setCheckpoint(task.id, value),
    },
  }

  // Set task to running
  await taskManager.setRunning(task.id)

  // Execute handler asynchronously
  ;(async () => {
    try {
      await handler(ctx)
    } catch (err) {
      if (err instanceof ClientCancelledError)
        return
      await ctx.state.fail(err)
    } finally {
      if (import.meta.dev) {
        if (task.status === 'running') {
          parentLogger.warn(
            { taskId: task.id },
            'Handler exited without calling complete() or fail()',
          )
        }
      }
    }
  })()

  return { kind: 'stream', stream: streamManager.stream }
}

function randomId(): string {
  return randomInt(1e6, 1e7 - 1).toString()
}
