import process from 'node:process'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import gracefulShutdown from 'http-graceful-shutdown'
import type { Kysely } from 'kysely'
import machineStatus from './api/machine_status'
import { config } from './config'
import { createKyselyInstance } from './database'
import type { DmExchangeDatabase, TeleskopDatabase } from './types'
import { logger } from './logger'

declare module 'fastify' {
  interface FastifyInstance {
    teleskop: Kysely<TeleskopDatabase>
    dmExchange: Kysely<DmExchangeDatabase> | null
  }
}

export async function main() {
  const fastify = Fastify({ logger })
  const teleskop = createKyselyInstance<TeleskopDatabase>(config.teleskopConnectionString)
  const dmExchange = config.dmExchangeConnectionString
    ? createKyselyInstance<DmExchangeDatabase>(config.dmExchangeConnectionString)
    : null

  if (!dmExchange) {
    logger.info(`DMEXCHANGE_CONNECTION_STRING is not set, ERP values will be null`)
  }

  fastify.decorate('teleskop', teleskop)
  fastify.decorate('dmExchange', dmExchange)

  fastify.register(cors)
  fastify.register(machineStatus, {
    prefix: '/api/v1',
  })

  fastify.listen({
    host: config.serverHost,
    port: config.serverPort,
  })

  gracefulShutdown(fastify.server, {
    async onShutdown() {
      await teleskop.destroy()
      await dmExchange?.destroy()
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
