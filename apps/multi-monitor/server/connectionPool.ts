import mssql from 'mssql'

const { ConnectionPool } = mssql
const config = useRuntimeConfig()
const pool = new ConnectionPool({
  server: config.teleskopHost,
  port: Number.parseInt(config.teleskopPort),
  user: config.teleskopUser,
  password: config.teleskopPassword.toString(),
  database: config.teleskopDatabase,
  options: {
    encrypt: false,
    database: config.teleskopDatabase,
    instanceName: config.teleskopInstanceName || undefined,
    trustServerCertificate: true,
  },
})
export default {
  pool,
}
