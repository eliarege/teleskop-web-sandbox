import { dmsDB } from '~/server/connectionPool'
import type { DatabaseConnection } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { type } = getQuery(event)
  const databaseConnection: DatabaseConnection = await dmsDB('DATABASE_SETTINGS').select({
    client: 'client',
    hostComputer: 'host_computer',
    user: 'user',
    password: 'password',
    host: 'host',
    port: 'port',
    database: 'database',
    type: 'db_type',
  })
    .where('db_type', type)
    .first()
  return databaseConnection
})
