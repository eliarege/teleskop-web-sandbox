import process from 'node:process'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import gracefulShutdown from 'http-graceful-shutdown'
import type { Kysely } from 'kysely'
import type { ConnectionOptions } from 'tedious'
import machineStatus from './api/machine-status'
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
  const teleskop = createKyselyInstance<TeleskopDatabase>(config.teleskopConnectionString || {
    host: config.teleskopHost,
    port: config.teleskopPort,
    database: config.teleskopDatabase,
    user: config.teleskopUser,
    password: config.teleskopPassword,
    instanceName: config.teleskopInstanceName,
    options: config.teleskopConnectionOptions as ConnectionOptions,
  })
  const dmExchange = config.dmExchangeConnectionString || config.dmExchangeEnabled
    ? createKyselyInstance<DmExchangeDatabase>(config.dmExchangeConnectionString || {
      host: config.dmExchangeHost,
      port: config.dmExchangePort,
      database: config.dmExchangeDatabase,
      user: config.dmExchangeUser,
      password: config.dmExchangePassword,
      instanceName: config.dmExchangeInstanceName,
      options: config.dmExchangeConnectionOptions as ConnectionOptions,
    })
    : null

  if (!dmExchange) {
    logger.info(`DMEXCHANGE disabled, ERP values will be null`)
  }

  fastify.decorate('teleskop', teleskop)
  fastify.decorate('dmExchange', dmExchange)

  fastify.register(cors, { prefix: config.serverPrefix })
  fastify.register(machineStatus, { prefix: config.serverPrefix })

  fastify.listen({
    host: config.serverHost,
    port: config.serverPort,
  })

  const defaultErrorHandler = fastify.errorHandler
  fastify.setErrorHandler((error, request, reply) => {
    // Kysely MSSQL Adapter sometimes returns errors as array
    error = Array.isArray(error) ? error[0] : error
    defaultErrorHandler(error, request, reply)
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
