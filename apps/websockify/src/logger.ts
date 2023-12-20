import process from 'node:process'
import Pino from 'pino'

export const logger = Pino({
  level: process.env.LOG_LEVEL || 'info',
})
