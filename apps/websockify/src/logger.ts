import Pino from 'pino'
import { config } from './config'

export const logger = Pino({
  level: config.logLevel,
})
