import process from 'node:process'
import { db } from '../db'
import { PtMigrationSource } from '#pt-migrations'

export default defineNitroPlugin((nitroApp) => {
  let migrating = true
  runMigrations().then(() => {
    migrating = false
  })
  nitroApp.h3App.use(defineEventHandler(() => {
    if (migrating) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Server is starting up, please try again later',
      })
    }
  }))
})

async function runMigrations() {
  try {
    await db.migrate.latest({
      tableName: 'TFMigrations',
      migrationSource: PtMigrationSource,
    })
    if (!import.meta.dev) {
      console.log('Migrations ran successfully.')
    }
  } catch (error) {
    console.error('Error running migrations:', error)
    if (!import.meta.dev) {
      process.exit(1)
    }
  }
}
