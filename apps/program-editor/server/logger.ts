import type { H3Event } from 'h3'
import pino from 'pino'

const logger = pino({
  name: 'program-editor',
})

export function useLogger(event: H3Event) {
  return logger.child({ user: event.context.kauth?.name })
}

export default logger
