import process from 'node:process'
import Knex from 'knex'

export const knex = Knex({
  client: 'mssql',
  connection: {
    server: 'staging',
    // host: process.env.teleskopHost,
    port: 7654,
    user: 'sa',
    password: '12345678tT',
    database: 'Teleskop',
    options: {
      trustServerCertificate: true,
    },
  },
})
