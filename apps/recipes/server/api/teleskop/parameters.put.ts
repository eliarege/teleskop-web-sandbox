import { connectTeleskopDB, dmsDB } from '~/server/connectionPool'
import type { DatabaseConnection } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const settings = await readBody(event)
  const teleskopConnection: DatabaseConnection = await dmsDB('TELESKOP_SETTINGS').first().update({
    client: settings.client,
    host_computer: settings.hostComputer,
    database: settings.database,
    user: settings.user,
    password: settings.password,
    host: settings.host,
    port: settings.port,
  })
  connectTeleskopDB(settings)
  return teleskopConnection
})
