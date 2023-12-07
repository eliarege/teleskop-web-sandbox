import process from 'node:process'
import Knex from 'knex'

export const knex = Knex({
  client: 'mssql',
  connection: {
    server: process.env.TELESKOP_HOST,
    // host: process.env.teleskopHost,
    port: Number.parseInt(process.env.TELESKOP_PORT || '1433'),
    user: process.env.TELESKOP_USER,
    password: process.env.TELESKOP_PASSWORD,
    database: process.env.TELESKOP_DATABASE,
    options: {
      trustServerCertificate: true,
    },
  },
})
