import type { Knex } from 'knex'
import knex from 'knex'
import type { Config } from '../config'

export function createTeleskopDatabase(config: Config): Knex {
  return knex({
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
}

export function createDmExchangeDatabase(config: Config): Knex | null {
  if (!config.dmExchangeEnabled) {
    return null
  }

  return knex({
    client: 'mssql',
    connection: {
      host: config.dmExchangeHost,
      port: config.dmExchangePort,
      user: config.dmExchangeUser,
      password: config.dmExchangePassword,
      database: config.dmExchangeDatabase,
      options: {
        trustServerCertificate: true,
        instanceName: config.dmExchangeInstanceName,
        ...(config.dmExchangeConnectionOptions || {}),
      },
    },
  })
}
