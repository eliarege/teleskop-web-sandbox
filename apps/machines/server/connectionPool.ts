import Knex from 'knex'
import { inferBoolean } from '@teleskop/utils'

const config = useRuntimeConfig()

function toBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean')
    return value
  if (typeof value === 'string')
    return inferBoolean(value)
  return false
}

export const isDmExchangeEnabled = toBoolean(config.dmexchangeEnabled)

const knex = Knex({
  client: 'mssql',
  connection: {
    host: config.teleskopHost,
    port: Number(config.teleskopPort),
    user: config.teleskopUser,
    password: String(config.teleskopPassword),
    database: config.teleskopDatabase,
    options: {
      instanceName: config.teleskopInstanceName,
      trustServerCertificate: true,
    },
  },
})

const dmExchangeKnex = isDmExchangeEnabled
  ? Knex({
      client: 'mssql',
      connection: {
        host: config.dmExchangeHost,
        port: Number(config.dmExchangePort),
        user: config.dmExchangeUser,
        password: String(config.dmExchangePassword),
        database: config.dmExchangeDatabase,
        options: {
          instanceName: config.dmExchangeInstanceName,
          trustServerCertificate: true,
        },
      },
    })
  : null

export {
  dmExchangeKnex,
  knex,
}
