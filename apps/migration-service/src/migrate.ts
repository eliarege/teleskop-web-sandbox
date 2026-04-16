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

async function migrateTeleskop(isDown?: boolean) {
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
  await migrate(teleskop, config.teleskopDatabase, new TeleskopMigrationSource(), isDown)
  await teleskop.destroy()
}

async function migrateDmExchange(isDown?: boolean) {
  if (!config.dmExchangeEnabled) {
    console.log('DM Exchange migration is disabled, skipping...')
    return
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
  await migrate(dmExchange, config.dmExchangeDatabase!, new DmExchangeMigrationSource(), isDown)
  await dmExchange.destroy()
}

async function main() {
  const isDown = process.argv.includes('down')
  await migrateTeleskop(isDown)
  if (config.dmExchangeEnabled) {
    await migrateDmExchange(isDown)
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
