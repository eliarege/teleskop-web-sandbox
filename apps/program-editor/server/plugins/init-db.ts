import process from 'node:process'
import { db } from '../database'
import { sql } from '../sql'

export default defineNitroPlugin(async () => {
  try {
    const config = useRuntimeConfig()
    const [{ compatibility_level }] = await db.raw(sql`
    SELECT compatibility_level
    FROM sys.databases WHERE name = ?`, [config.teleskopDatabase])

    if (compatibility_level < 130) {
      await db.raw(sql`ALTER DATABASE [${config.teleskopDatabase}] SET COMPATIBILITY_LEVEL = 130`)
    }
  } catch (e) {
    console.error('Failed to set COMPATIBILITY_LEVEL', e)
    if (!import.meta.dev) {
      process.exit(1)
    }
  }
})
