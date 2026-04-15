import knex from 'knex'

const config = useRuntimeConfig()

export const db = knex({
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

export const dmExchange = config.dmexchangeEnabled
  ? knex({
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
