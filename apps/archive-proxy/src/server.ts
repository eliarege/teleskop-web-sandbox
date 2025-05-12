import process from 'node:process'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import gracefulShutdown from 'http-graceful-shutdown'
import { config } from './config'
import { logger } from './logger'
import { proxy } from './proxy'
import { db } from './database'

export async function main() {
  const fastify = Fastify({ logger })

  fastify.register(cors, { prefix: config.serverPrefix })
  fastify.register(proxy, { prefix: config.serverPrefix })

  fastify.listen({
    host: config.serverHost,
    port: config.serverPort,
  })

  gracefulShutdown(fastify.server, {
    async onShutdown() {
      await db.destroy()
    },
    finally() {
      logger.info('Server gracefully shut down')
    },
  })
}

main().catch((err) => {
  logger.error(err)
  process.exit(1)
})
