import mssql from 'mssql'

const { ConnectionPool } = mssql
const config = useRuntimeConfig()
const pool = new ConnectionPool({
  server: config.teleskopHost,
  port: Number.parseInt(config.teleskopPort),
  user: config.teleskopUser,
  password: String(config.teleskopPassword),
  database: config.teleskopDatabase,
  options: {
    encrypt: false,
    instanceName: config.teleskopInstanceName,
    trustServerCertificate: true,
  },
})
export default {
  pool,
}
