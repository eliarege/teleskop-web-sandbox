import process from 'node:process'
import { logger } from './logger'
import { startServer } from './server'
import { config } from './config'

async function main() {
  await startServer({
    host: config.serverHost,
    port: config.serverPort,
  })
}

main().catch((err) => {
  logger.error(err)
  process.exit(1)
})
