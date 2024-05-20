import Knex from 'knex'

const config = useRuntimeConfig()

export const db = Knex({
  client: 'mssql',
  connection: {
    host: config.teleskopHost,
    port: Number.parseInt(config.teleskopPort),
    user: config.teleskopUser,
    password: String(config.teleskopPassword),
    database: config.teleskopDatabase,
    options: {
      instanceName: config.teleskopInstanceName || undefined,
      trustServerCertificate: true,
    },
  },
})
