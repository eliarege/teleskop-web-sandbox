import Knex from 'knex'
import { config } from './config'

export const db = Knex({
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
