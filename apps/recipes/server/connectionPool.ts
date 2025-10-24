import Knex from 'knex'
import { MigrationSource } from '#migration-source'
import type { DatabaseConnection } from '~/shared/types'

const config = useRuntimeConfig()
// Set up the connection
const dmsDB = Knex({
  client: 'pg',
  connection: {
    host: config.dmsHost,
    port: Number.parseInt(config.dmsPort),
    user: config.dmsUser,
    password: config.dmsPassword,
    database: config.dmsDatabase,
  },
  migrations: {
    migrationSource: MigrationSource,
  },
})

let teleskopDB: null | Knex.Knex<any, unknown[]> = null
let dmExchangeDB: null | Knex.Knex<any, unknown[]> = null

async function getTeleskopDB() {
  if (teleskopDB === null) {
    const teleskopConnection = await $fetch<DatabaseConnection>('/api/database/parameters', { query: { type: 'teleskop' } })
    return connectTeleskopDB(teleskopConnection)
  }
  return teleskopDB
}
function connectTeleskopDB(connection: DatabaseConnection) {
  teleskopDB?.destroy()
  teleskopDB = Knex({
    client: connection.client,
    connection: {
      user: connection.user,
      password: connection.password,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      requestTimeout: 5000,
      options: {
        connectTimeout: 5000,
      },
    },
  })

  return teleskopDB
}

async function getDmExchangeDB() {
  if (dmExchangeDB === null) {
    const dmExchangeConnection = await $fetch<DatabaseConnection>('/api/database/parameters', { query: { type: 'dmexchange' } })
    return connectDmExchangeDB(dmExchangeConnection)
  }
  return dmExchangeDB
}
function connectDmExchangeDB(connection: DatabaseConnection) {
  dmExchangeDB?.destroy()
  dmExchangeDB = Knex({
    client: connection.client,
    connection: {
      user: connection.user,
      password: connection.password,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      requestTimeout: 5000,
      options: {
        connectTimeout: 5000,
      },
    },
  })
  return dmExchangeDB
}

dmsDB.raw('select 1+1 as result')
  .then(() => console.log('Connected to the SQL Server via knex'))
  .catch((err: any) => console.error('Error connecting to DMS SQL Server:', err))

export {
  dmsDB,
  getTeleskopDB,
  connectTeleskopDB,
  getDmExchangeDB,
  connectDmExchangeDB,
}
