import process from 'node:process'
import { db } from './db'
import { config } from './config'
import { RollupMigrationSource } from '#migrations'

const MIGRATION_TABLE = 'TFMigrations'

async function migrate(isDown?: boolean): Promise<boolean> {
  console.log('Starting migration...')
  try {
    await setCompatibilityLevel(130)
    if (isDown) {
      await db.migrate.down({
        tableName: MIGRATION_TABLE,
        migrationSource: new RollupMigrationSource(),
      })
      console.log('Rollback completed successfully.')
      return true
    } else {
      await db.migrate.latest({
        tableName: MIGRATION_TABLE,
        migrationSource: new RollupMigrationSource(),
      })
      console.log('Migration completed successfully.')
      return true
    }
  } catch (error) {
    console.error('Migration failed:', error)
    return false
  } finally {
    await db.destroy()
  }
}

async function setCompatibilityLevel(level: number) {
  const [{ currentCompatibilityLevel }] = await db.raw(/* sql */`
    SELECT compatibility_level currentCompatibilityLevel
    FROM sys.databases
    WHERE name = '${config.teleskopDatabase}'
  `)
  if (currentCompatibilityLevel < level) {
    console.log(`Setting database compatibility level to ${level}...`)
    return db.raw(/* sql */`
      ALTER DATABASE ${config.teleskopDatabase}
      SET COMPATIBILITY_LEVEL = ${level}
    `)
  }
}
const isDown = process.argv.includes('down')
migrate(isDown).then((success) => {
  process.exit(success ? 0 : 1)
})
