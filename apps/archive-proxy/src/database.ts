import Knex from 'knex'
import { config } from './config'
import { logger } from './logger'

const clog = logger.child({ name: 'db' })

export const db = Knex({
  client: 'mssql',
  log: {
    debug: clog.debug.bind(clog),
    error: clog.error.bind(clog),
    warn: clog.warn.bind(clog),
    deprecate: clog.warn.bind(clog),
  },
  connection: {
    host: config.teleskopHost,
    port: config.teleskopPort,
    user: config.teleskopUser,
    password: config.teleskopPassword,
    database: config.teleskopDatabase,
    options: {
      instanceName: config.teleskopInstanceName,
    },
  },
})
