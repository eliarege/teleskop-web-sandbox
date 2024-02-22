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

let teleskopDB: null | Knex.Knex<any, unknown[]> = null

async function getTeleskopDB() {
  if (teleskopDB === null) {
    const teleskopConnection = await $fetch('/api/teleskop/parameters')
    return connectTeleskopDB(teleskopConnection)
  }
  return teleskopDB
}
function connectTeleskopDB(connection: any) {
  teleskopDB?.destroy()
  teleskopDB = Knex({
    client: 'mssql',
    connection,
  })
  return teleskopDB
}

dmsDB.raw('select 1+1 as result')
  .then(() => console.log('Connected to the SQL Server via knex'))
  .catch((err: any) => console.error('Error connecting to DMS SQL Server:', err))

export {
  dmsDB,
  getTeleskopDB,
  connectTeleskopDB,
}
