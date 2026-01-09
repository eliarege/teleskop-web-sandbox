export type StreamMessageType = 'log' | 'meta' | 'complete' | 'fail' | 'progress'
export type StreamLogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface TaskI18n {
  key: string
  params?: Record<string, unknown>
}

export type StreamDataMeta = {
  i18n?: TaskI18n
  [key: string]: any
}

export type StreamLogMessage = {
  type: 'log'
  level: StreamLogLevel
  message?: string
  meta?: StreamDataMeta
  [key: string]: any
}

export type StreamMetaMessage = {
  type: 'meta'
  id: string
}

export type StreamCompleteMessage = {
  type: 'complete'
  message?: string
  meta?: StreamDataMeta
}

export type StreamErrorMessage = {
  type: 'fail'
  message?: string
  error?: string
  meta?: StreamDataMeta
}

export type StreamProgressMessage = {
  type: 'progress'
  progress: number
}

export type StreamMessage =
  | StreamLogMessage
  | StreamMetaMessage
  | StreamCompleteMessage
  | StreamErrorMessage
  | StreamProgressMessage
