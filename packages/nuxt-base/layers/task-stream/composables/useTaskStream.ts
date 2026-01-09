import { readonly, ref } from 'vue'
import { withQuery } from 'ufo'
import type { StreamLogLevel, StreamMessage } from '../shared/taskStream.types'

export interface TaskStreamLogEntry {
  timestamp: Date
  level: StreamLogLevel | 'success'
  message: string
}

export type TaskStreamFetchOptions = Omit<RequestInit, 'body' | 'signal'> & { body?: any }

export function useTaskStream() {
  const kc = useKeycloak()
  const { t } = useI18n()
  const isRunning = ref(false)
  const isSuccess = ref(false)
  const isError = ref(false)
  const isAborted = ref(false)
  const logs = ref<TaskStreamLogEntry[]>([])
  const errorMessage = ref<string | null>(null)
  const progress = ref(0)
  const taskId = ref<string | null>(null)

  let abortController: AbortController | null = null

  const reset = () => {
    isRunning.value = false
    isSuccess.value = false
    isError.value = false
    isAborted.value = false
    logs.value = []
    errorMessage.value = null
    progress.value = 0
  }

  const addLog = (level: TaskStreamLogEntry['level'], message: string) => {
    logs.value.push({
      timestamp: new Date(),
      level,
      message,
    })
  }

  const handleSSEData = (data: string) => {
    try {
      const parsed = JSON.parse(data) as StreamMessage

      switch (parsed.type) {
        case 'log':
          if (parsed.message || parsed.meta?.i18n) {
            // Handle i18n translation if present
            let message = parsed.message || ''
            if (parsed.meta?.i18n) {
              const { key, params } = parsed.meta.i18n
              const translatedMessage = t(key, params ?? {})
              // Append additional message if present (for template patterns)
              message = message ? `${translatedMessage}${message}` : translatedMessage
            }
            if (message) {
              addLog(parsed.level, message)
            }
          }
          break
        case 'meta':
          taskId.value = parsed.id
          break
        case 'progress':
          progress.value = parsed.progress
          break
        case 'complete': {
          isSuccess.value = true
          isRunning.value = false
          progress.value = 100
          // Handle i18n translation if present
          let completeMessage = parsed.message || ''
          if (parsed.meta?.i18n) {
            const { key, params } = parsed.meta.i18n
            const translatedMessage = t(key, params ?? {})
            // Append additional message if present
            completeMessage = completeMessage ? `${translatedMessage}${completeMessage}` : translatedMessage
          }
          addLog('success', completeMessage || t('taskStream.completedSuccessfully'))
          break
        }
        case 'fail': {
          isError.value = true
          // Handle i18n translation if present
          let failMessage = parsed.message || ''
          if (parsed.meta?.i18n) {
            const { key, params } = parsed.meta.i18n
            const translatedMessage = t(key, params ?? {})
            // Append additional message if present
            failMessage = failMessage ? `${translatedMessage}${failMessage}` : translatedMessage
          }
          errorMessage.value = failMessage || t('taskStream.unknownError')
          addLog('error', errorMessage.value)
          if (parsed.error) {
            addLog('error', t('taskStream.errorDetails', { message: parsed.error }))
          }
          isRunning.value = false
          break
        }
      }
    } catch (e) {
      // If not JSON, treat as plain log message
      addLog('info', data)
    }
  }

  /**
   * Body should be a JSON-serializable object if provided. `Accept`, `Content-Type`, and `Authorization` headers are set automatically.
   *
   * @param url
   * @param fetchOptions
   */
  const start = (url: string, fetchOptions?: TaskStreamFetchOptions) => {
    reset()
    isRunning.value = true

    abortController = new AbortController()

    fetch(url, {
      ...fetchOptions,
      method: fetchOptions?.method || 'GET',
      headers: {
        ...fetchOptions?.headers,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(kc.token.value ? { Authorization: `Bearer ${kc.token.value}` } : {}),
      },
      body: fetchOptions?.body ? JSON.stringify(fetchOptions.body) : undefined,
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done)
            break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              handleSSEData(data)
            }
          }
        }

        // Process any remaining buffer
        if (buffer.startsWith('data: ')) {
          handleSSEData(buffer.slice(6))
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          isError.value = true
          errorMessage.value = error.message
          addLog('error', t('taskStream.connectionError', { message: error.message }))
        }
        isRunning.value = false
      })
  }

  const abort = () => {
    // If request is non GET request, send a fetch to abort endpoint
    abortController?.abort()
    isRunning.value = false
    isAborted.value = true
    addLog('warn', t('taskStream.abortedByUser'))
  }

  /** Should be used when SSE endpoint is a non-GET request. Should send same payload as the original */
  const abortByFetch = async (url: string, fetchOptions?: TaskStreamFetchOptions) => {
    try {
      const response = await fetch(withQuery(url, { action: 'abort', taskId: taskId.value }), {
        ...fetchOptions,
        method: fetchOptions?.method || 'GET',
        headers: {
          ...fetchOptions?.headers,
          'Content-Type': 'application/json',
          ...(kc.token.value ? { Authorization: `Bearer ${kc.token.value}` } : {}),
        },
        body: fetchOptions?.body ? JSON.stringify(fetchOptions.body) : undefined,
      })
      if (!response.ok) {
        const error = await response.text()
        addLog('error', t('taskStream.abortRequestError', { message: error }))
      } else {
        addLog('warn', t('taskStream.abortedByUser'))
      }
      abortController?.abort()
      isRunning.value = false
      isAborted.value = true
    } catch (error) {
      addLog('error', t('taskStream.abortRequestError', { message: (error as Error).message }))
    }
  }

  return {
    taskId: readonly(taskId),
    isRunning: readonly(isRunning),
    isSuccess: readonly(isSuccess),
    isError: readonly(isError),
    isAborted: readonly(isAborted),
    logs: readonly(logs),
    errorMessage: readonly(errorMessage),
    progress: readonly(progress),
    start,
    abort,
    abortByFetch,
    reset,
  }
}
