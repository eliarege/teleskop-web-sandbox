import process from 'node:process'
import type { Knex } from 'knex'
import knex from 'knex'
import { config } from './config'
import { RollupMigrationSource as TeleskopMigrationSource } from '#migrations/teleskop'
import { RollupMigrationSource as DmExchangeMigrationSource } from '#migrations/dmexchange'

const MIGRATION_TABLE = 'TFMigrations'

async function migrate(db: Knex, dbName: string, source: Knex.MigrationSource<string>, isDown?: boolean): Promise<boolean> {
  console.log(`Starting migration for ${dbName}...`)
  try {
    await setCompatibilityLevel(db, dbName, 130)
    if (isDown) {
      await db.migrate.down({
        tableName: MIGRATION_TABLE,
        migrationSource: source,
      })
      console.log(`Rollback for ${dbName} completed successfully.`)
      return true
    } else {
      await db.migrate.latest({
        tableName: MIGRATION_TABLE,
        migrationSource: source,
      })
      console.log(`Migration for ${dbName} completed successfully.`)
      return true
    }
  } catch (error) {
    console.error(`Migration for ${dbName} failed:`, error)
    return false
  } finally {
    await db.destroy()
  }
}

async function setCompatibilityLevel(db: Knex, dbName: string, level: number) {
  const [{ currentCompatibilityLevel }] = await db.raw(/* sql */`
    SELECT compatibility_level currentCompatibilityLevel
    FROM sys.databases
    WHERE name = '${dbName}'
  `)
  if (currentCompatibilityLevel < level) {
    console.log(`Setting database compatibility level to ${level}...`)
    return db.raw(/* sql */`
      ALTER DATABASE ${dbName}
      SET COMPATIBILITY_LEVEL = ${level}
    `)
  }
}

async function migrateTeleskop(isDown?: boolean): Promise<boolean> {
  const teleskop = knex({
    client: 'mssql',
    connection: {
      host: config.teleskopHost,
      port: config.teleskopPort,
      user: config.teleskopUser,
      password: config.teleskopPassword,
      database: config.teleskopDatabase,
      connectTimeout: 30_000,
      options: {
        instanceName: config.teleskopInstanceName,
        trustServerCertificate: true,
        ...config.teleskopConnectionOptions,
      },
    },
  })
  const success = await migrate(
    teleskop,
    config.teleskopDatabase,
    new TeleskopMigrationSource(),
    isDown
  )
  return success
}

async function migrateDmExchange(isDown?: boolean): Promise<boolean> {
  if (!config.dmExchangeEnabled) {
    console.log('DM Exchange migration is disabled, skipping...')
    return true
  }
  const dmExchange = knex({
    client: 'mssql',
    connection: {
      host: config.dmExchangeHost,
      port: config.dmExchangePort,
      user: config.dmExchangeUser,
      password: config.dmExchangePassword,
      database: config.dmExchangeDatabase,
      connectTimeout: 30_000,
      options: {
        instanceName: config.dmExchangeInstanceName,
        trustServerCertificate: true,
        ...config.dmExchangeConnectionOptions,
      },
    },
  })
  const success = await migrate(
    dmExchange,
    config.dmExchangeDatabase!,
    new DmExchangeMigrationSource(),
    isDown
  )
  return success
}

async function main() {
  const isDown = process.argv.includes('down')
  let success = await migrateTeleskop(isDown)
  if (config.dmExchangeEnabled) {
    success = await migrateDmExchange(isDown)
  }
  if (!success) {
    throw new Error('Migration process failed')
  }
}

main()
  .then(() => {
    console.log('All migrations completed successfully.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration process failed:', error)
    process.exit(1)
  })
