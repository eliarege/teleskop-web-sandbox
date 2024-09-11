import pino from 'pino'

const logger = pino({
  level: 'info',
  name: 'program-editor',
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: true,
    },
  },
})

export default logger
