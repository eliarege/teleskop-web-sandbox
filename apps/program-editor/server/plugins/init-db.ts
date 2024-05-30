import { db } from '../database'
import { sql } from '../sql'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const [{ compatibility_level }] = await db.raw(sql`
    SELECT compatibility_level
    FROM sys.databases WHERE name = ?`, [config.teleskopDatabase])

  if (compatibility_level < 130) {
    await db.raw(sql`ALTER DATABASE ${config.teleskopDatabase} SET COMPATIBILITY_LEVEL = 130`)
  }
})
