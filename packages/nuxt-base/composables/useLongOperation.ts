import { readonly, ref } from 'vue'

export interface LogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
}

export type LongOperation = ReturnType<typeof useLongOperation>

export function useLongOperation() {
  const kc = useKeycloak()
  const { t } = useI18n()
  const isRunning = ref(false)
  const isSuccess = ref(false)
  const isError = ref(false)
  const isAborted = ref(false)
  const logs = ref<LogEntry[]>([])
  const errorMessage = ref<string | null>(null)
  const progress = ref(0)

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

  const addLog = (level: LogEntry['level'], message: string) => {
    logs.value.push({
      timestamp: new Date(),
      level,
      message,
    })
  }

  const handleSSEData = (data: string) => {
    try {
      const parsed = JSON.parse(data)

      // Update progress if present
      if (typeof parsed.progress === 'number') {
        progress.value = parsed.progress
      }

      switch (parsed.type) {
        case 'log':
          if (parsed.message) {
            addLog(parsed.level || 'info', parsed.message)
          }
          break
        case 'progress':
          // Progress-only update, no log needed
          break
        case 'complete':
          isSuccess.value = true
          isRunning.value = false
          progress.value = 100
          addLog('success', parsed.message || t('operation.completedSuccessfully'))
          break
        case 'error':
          isError.value = true
          errorMessage.value = parsed.message
          addLog('error', parsed.message)
          isRunning.value = false
          break
      }
    } catch (e) {
      // If not JSON, treat as plain log message
      addLog('info', data)
    }
  }

  const start = (url: string, options?: { method?: string, body?: any }) => {
    reset()
    isRunning.value = true

    abortController = new AbortController()

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${kc.token}`,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
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
          addLog('error', t('operation.connectionError', { message: error.message }))
        }
        isRunning.value = false
      })
  }

  const abort = () => {
    abortController?.abort()
    isRunning.value = false
    isAborted.value = true
    addLog('warn', t('operation.abortedByUser'))
  }

  return {
    isRunning: readonly(isRunning),
    isSuccess: readonly(isSuccess),
    isError: readonly(isError),
    isAborted: readonly(isAborted),
    logs: readonly(logs),
    errorMessage: readonly(errorMessage),
    progress: readonly(progress),
    start,
    abort,
    reset,
  }
}
