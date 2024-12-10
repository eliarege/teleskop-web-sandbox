import Knex from 'knex'

const config = useRuntimeConfig()
export const knex = Knex({
  client: 'mssql',
  connection: {
    server: config.teleskopHost,
    port: Number(config.teleskopPort),
    user: config.teleskopUser,
    password: String(config.teleskopPassword),
    database: config.teleskopDatabase,
    connectTimeout: 30_000,
    options: {
      instanceName: config.teleskopInstanceName,
      trustServerCertificate: true,
    },
  },
})
