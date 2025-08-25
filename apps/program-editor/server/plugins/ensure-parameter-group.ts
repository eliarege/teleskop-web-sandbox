import process from 'node:process'
import { db } from '../database'
import { sql } from '../sql'
import logger from '../logger'

export default defineNitroPlugin(async () => {
  try {
    const config = useRuntimeConfig()

    const [{ count }] = await db.raw(sql`
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'BFCOMMANDPARAMETERS'
        AND COLUMN_NAME = 'PARAMETERGROUP'
        AND TABLE_CATALOG = ?`, [config.teleskopDatabase])

    if (count === 0) {
      await db.raw(sql`ALTER TABLE [${config.teleskopDatabase}].[dbo].[BFCOMMANDPARAMETERS] ADD [PARAMETERGROUP] INT NULL`)
      logger.info('PARAMETERGROUP column added.')
    }
  } catch (e) {
    logger.error({ error: e }, 'PARAMETERGROUP column could not be added.')
    if (!import.meta.dev)
      process.exit(1)
  }
})
