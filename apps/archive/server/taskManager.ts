import type { H3Event } from 'h3'
import type { TaskConfig, TaskStatus, TaskStepContext } from '~/types/archive'

let counter = 0

const registeredTasks: Map<number, TaskStatus> = new Map()

export const taskManager = {
  async createTask(event: H3Event, config: TaskConfig): Promise<ReadableStream> {
    const taskId = counter++
    const task: TaskStatus = {
      maxSteps: config.maxSteps,
      currentStep: 0,
      message: 'Loading',
      state: 'active',
    }
    let cancelled = false
    const step: TaskStepContext = {
      isCancelled: () => cancelled,
      next: (ctx) => {
        if (task.state !== 'cancelled') {
          task.currentStep++
          task.message = ctx.message
          if (task.currentStep >= task.maxSteps)
            task.state = 'completed'
        }
      },
    }
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(' ')
        try {
          const data = await config.handler(step)
          if (task.state !== 'cancelled' && data) {
            controller.enqueue(JSON.stringify({
              status: 'success',
              data,
            }))
            controller.close()
          }
        } catch (err: any) {
          task.state = 'failed'
          console.error(err)
          controller.enqueue(JSON.stringify({
            status: 'error',
            error: {
              message: err.message,
              data: err.data || null,
            },
          }))
          task.message = err.message || 'error'
          controller.close()
        }
      },
      cancel() {
        cancelled = true
        task.state = 'cancelled'
      },
    })
    setResponseHeader(event, 'Task-ID', taskId)
    setResponseHeader(event, 'Content-Type', 'application/json')
    setResponseHeader(event, 'Cache-Control', 'no-cache')
    setResponseHeader(event, 'Transfer-Encoding', 'chunked')
    registeredTasks.set(taskId, task)

    return stream
  },
  getTaskStatus(taskId: number) {
    const step = registeredTasks.get(taskId)
    return step || null
  },
} as const
