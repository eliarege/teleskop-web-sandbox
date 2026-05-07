import process from 'node:process'
import { pino } from 'pino'
import Knex from 'knex'
import { defineConfiguration } from '@teleskop/utils'
import { KnexBatchRepository } from './repository/BatchRepository'
import { buildApp } from './app'

const config = defineConfiguration({
  serverHost: {
    env: ['SERVER_HOST'],
    default: '0.0.0.0',
  },
  serverPort: {
    env: ['SERVER_PORT'],
    type: 'integer',
    default: 8080,
  },
  archiveDirectory: {
    env: ['ARCHIVE_DIR'],
    required: true,
  },
  /** Teleskop database connection settings */
  teleskopHost: {
    env: ['TELESKOP_HOST', 'NUXT_TELESKOP_HOST'],
    required: true,
  },
  teleskopPort: {
    env: ['TELESKOP_PORT', 'NUXT_TELESKOP_PORT'],
    type: 'integer',
    default: 1433,
  },
  teleskopUser: {
    env: ['TELESKOP_USER', 'NUXT_TELESKOP_USER'],
    required: true,
  },
  teleskopPassword: {
    env: ['TELESKOP_PASSWORD', 'NUXT_TELESKOP_PASSWORD'],
    required: true,
  },
  teleskopDatabase: {
    env: ['TELESKOP_DATABASE', 'NUXT_TELESKOP_DATABASE'],
    required: true,
  },
  teleskopInstanceName: {
    env: ['TELESKOP_INSTANCE_NAME', 'NUXT_TELESKOP_INSTANCE_NAME'],
  },
  /** Extra Querystring connection options */
  teleskopConnectionOptions: {
    env: ['TELESKOP_CONNECTION_OPTIONS', 'NUXT_TELESKOP_CONNECTION_OPTIONS'],
    type: 'querystring',
  },
  teleskopTimezoneOffset: {
    env: ['TELESKOP_TIMEZONE_OFFSET', 'NUXT_TELESKOP_TIMEZONE_OFFSET'],
    type: 'integer',
    default: -180,
  },
  logLevel: {
    env: ['LOG_LEVEL', 'NUXT_LOG_LEVEL'],
    type: 'string',
    default: 'info',
  },
}).parse()

const logger = pino({ level: config.logLevel })
const db = Knex({
  client: 'mssql',
  connection: {
    host: config.teleskopHost,
    port: config.teleskopPort,
    user: config.teleskopUser,
    password: config.teleskopPassword,
    database: config.teleskopDatabase,
    options: {
      instanceName: config.teleskopInstanceName,
      encrypt: false,
      trustServerCertificate: true,
      ...(config.teleskopConnectionOptions || {}),
    },
  },
})

const repo = new KnexBatchRepository(db)
const app = buildApp(repo, { logger }, {
  archiveDirectory: config.archiveDirectory,
  timezoneOffset: config.teleskopTimezoneOffset,
})

app.listen({
  port: config.serverPort,
  host: config.serverHost,
}, (err, address) => {
  if (err) {
    logger.error(err)
    process.exit(1)
  }
  logger.info(`Server listening at ${address}`)
})
