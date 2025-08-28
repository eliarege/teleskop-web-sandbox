import process from 'node:process'
import { RequestError } from 'tedious'
import { db } from '../db'

// Documentation: https://learn.microsoft.com/en-us/sql/relational-databases/errors-events/database-engine-events-and-errors-2000-to-2999?view=sql-server-ver17
const ERR_OBJECT_EXISTS = 2714

export default defineNitroPlugin(async () => {
  const tableName = 'BFMACHINETRANSLATIONS'
  try {
    const exists = await db.schema.hasTable(tableName)
    if (exists) {
      await db.schema.createTable(tableName, (table) => {
        table.integer('machine_id').notNullable()
        table.integer('from_locale').notNullable()
        table.integer('to_locale').notNullable()
        table.jsonb('messages').notNullable()
      })
      console.log(`Table ${tableName} created successfully!`)
    }
  } catch (err) {
    if (err instanceof RequestError && err.number === ERR_OBJECT_EXISTS) {
      console.log(`Table ${tableName} already exists.`)
    } else {
      console.error(`Failed to create ${tableName} table:`, err)
      if (!import.meta.dev) {
        process.exit(1)
      }
    }
  }
})
