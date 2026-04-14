import { connectDmExchangeDB, connectTeleskopDB, dmsDB } from '~/server/connectionPool'
import type { DatabaseConnection } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const settings = await readBody(event)
  const { type } = getQuery(event)

  const databaseConnection: DatabaseConnection = await dmsDB('DATABASE_SETTINGS').update({
    client: settings.client,
    host_computer: settings.hostComputer,
    database: settings.database,
    user: settings.user,
    password: settings.password,
    host: settings.host,
    port: settings.port,
    db_type: type
  })
  .where('db_type', type)
  if (type === 'teleskop')
    connectTeleskopDB(settings)
  else if (type === 'dmexchange')
    connectDmExchangeDB(settings)
  return databaseConnection
})
