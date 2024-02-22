import { dmsDB } from '~/server/connectionPool'
import type { DatabaseConnection } from '~/shared/types'

export default defineEventHandler(async () => {
  try {
    const teleskopConnection: DatabaseConnection = await dmsDB('TELESKOP_SETTINGS').select({
      user: 'user',
      password: 'password',
      host: 'host',
      port: 'port',
      database: 'database',
    })
      .first()
    return teleskopConnection
  } catch (e) {
    console.log(e)
    return e
  }
})
