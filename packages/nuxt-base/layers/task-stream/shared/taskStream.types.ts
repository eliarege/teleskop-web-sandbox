export type StreamMessageType = 'log' | 'meta' | 'complete' | 'fail' | 'progress'
export type StreamLogLevel = 'info' | 'warn' | 'error' | 'debug'

export type StreamLogMessage = {
  type: 'log'
  level: StreamLogLevel
  message?: string
  [key: string]: any
}

export type StreamMetaMessage = {
  type: 'meta'
  id: string
}

export type StreamCompleteMessage = {
  type: 'complete'
  message?: string
}

export type StreamErrorMessage = {
  type: 'fail'
  message: string
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
