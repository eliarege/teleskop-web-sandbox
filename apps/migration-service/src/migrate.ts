import process from 'node:process'
import { db } from './db'

async function migrate(): Promise<boolean> {
  console.log('Starting migration...')
  try {
    await db.migrate.latest({
      tableName: 'TFMigrations',
    })
    console.log('Migration completed successfully.')
    return true
  } catch (error) {
    console.error('Migration failed:', error)
    return false
  } finally {
    await db.destroy()
  }
}

const success = await migrate()
process.exit(success ? 0 : 1)
