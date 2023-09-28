import Knex from 'knex'

const config = useRuntimeConfig()

// Set up the connection
const knex = Knex({
  client: 'mssql',
  connection: {
    host: config.teleskopHost,
    port: Number.parseInt(config.teleskopPort),
    user: config.teleskopUser,
    password: config.teleskopPassword.toString(),
    database: config.teleskopDatabase,
    options: {
      trustServerCertificate: true,
    },
  },
})

knex.raw('select 1+1 as result')
  .then(() => console.log('Connected to the SQL Server via knex'))
  .catch((err: any) => console.error('Error connecting to SQL Server:', err))

export { knex }
