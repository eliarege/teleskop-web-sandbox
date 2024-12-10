import Knex from 'knex'
import { config } from './config'

export const knex = Knex({
  client: 'mssql',
  connection: {
    server: config.teleskopHost,
    port: config.teleskopPort,
    user: config.teleskopUser,
    password: config.teleskopPassword,
    database: config.teleskopDatabase,
    connectTimeout: 30_000,
    options: {
      instanceName: config.teleskopInstanceName,
      trustServerCertificate: true,
    },
  },
})
