import knex from 'knex'
import { config } from './config'

export const db = knex({
  client: 'mssql',
  connection: {
    host: config.teleskopHost,
    port: config.teleskopPort,
    user: config.teleskopUser,
    password: config.teleskopPassword,
    database: config.teleskopDatabase,
    connectTimeout: 30_000,
    options: {
      instanceName: config.teleskopInstanceName,
      trustServerCertificate: true,
      ...config.teleskopConnectionOptions,
    },
  },
})
