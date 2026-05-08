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

console.log(isDmExchangeEnabled
    ? 'DmExchange connection pool enabled'
    : 'DmExchange connection pool disabled'
)

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
        host: config.dmexchangeHost,
        port: Number(config.dmexchangePort),
        user: config.dmexchangeUser,
        password: String(config.dmexchangePassword),
        database: config.dmexchangeDatabase,
        options: {
          instanceName: config.dmexchangeInstanceName,
          trustServerCertificate: true,
        },
      },
    })
  : null

export {
  dmExchangeKnex,
  knex,
}
