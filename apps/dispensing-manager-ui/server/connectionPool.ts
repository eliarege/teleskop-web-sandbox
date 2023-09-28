import mssql from 'mssql'
import Knex from 'knex'

// Set up the connection
const knex = Knex({
  client: 'mssql',
  connection: {
    host: '192.168.16.87',
    port: 7654,
    user: 'sa',
    password: '12345678tT',
    database: 'Teleskop',
    options: {
      trustServerCertificate: true,
    },
  },
})

knex.raw('select 1+1 as result')
  .then(() => console.log('Connected to the SQL Server via knex'))
  .catch((err: any) => console.error('Error connecting to SQL Server:', err))

const { ConnectionPool } = mssql
const pool = new ConnectionPool({
  server: '192.168.16.87',
  port: 7654,
  user: 'sa',
  password: '12345678tT',
  database: 'Teleskop',
  options: {
    trustServerCertificate: true,
  },
})
export {
  pool,
  knex,
}

pool.connect()
  .then(() => {
    console.log('Connected to the SQL Server')
  })
  .catch((err) => {
    console.error('Error connecting to SQL Server: ', err)
  })
