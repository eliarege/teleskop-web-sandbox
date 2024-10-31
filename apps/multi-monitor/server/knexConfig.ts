import Knex from 'knex'

const config = useRuntimeConfig()
export const knex = Knex({
  client: 'mssql',
  connection: {
    server: config.teleskopHost,
    ...(
      config.teleskopInstanceName
        ? { instanceName: config.teleskopInstanceName }
        : { port: config.teleskopPort }
    ),
    user: config.teleskopUser,
    password: config.teleskopPassword,
    database: config.teleskopDatabase,
    connectTimeout: 30_000,
    options: {
      trustServerCertificate: true,
    },
  },
})
