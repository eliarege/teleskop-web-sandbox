import Knex from 'knex'

const config = useRuntimeConfig()
const knex = Knex({
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

export {
  knex,
}
