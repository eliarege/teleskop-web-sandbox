import Knex from 'knex'

const config = useRuntimeConfig()
// Set up the connection
const dmsDB = Knex({
  client: 'pg',
  connection: {
    host: config.dmsHost,
    port: Number.parseInt(config.dmsPort),
    user: config.dmsUser,
    password: config.dmsPassword,
    database: config.dmsDatabase,
  },
})

const teleskopDB = Knex({
  client: 'mssql',
  connection: {
    host: config.teleskopHost,
    port: Number.parseInt(config.teleskopPort),
    user: config.teleskopUser,
    password: config.teleskopPassword,
    database: config.teleskopDatabase,
    options: {
      trustServerCertificate: true,
    },
  },
})
dmsDB.raw('select 1+1 as result')
  .then(() => console.log('Connected to the SQL Server via knex'))
  .catch((err: any) => console.error('Error connecting to DMS SQL Server:', err))

teleskopDB.raw('select 1+1 as result')
  .then(() => console.log('Connected to the Teleskop SQL Server via knex'))
  .catch((err: any) => console.error('Error connecting to Teleskop SQL Server:', err))
export {
  dmsDB,
  teleskopDB,
}
