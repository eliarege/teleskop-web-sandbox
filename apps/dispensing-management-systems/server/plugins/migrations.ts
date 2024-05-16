import process from 'node:process'
import { dmsDB } from '~/server/connectionPool'

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
    await dmsDB.migrate.latest()
    console.log('Migrations ran successfully.')
  } catch (error) {
    console.error('Error running migrations:', error)
    if (!import.meta.dev) {
      process.exit(1)
    }
  }
}
