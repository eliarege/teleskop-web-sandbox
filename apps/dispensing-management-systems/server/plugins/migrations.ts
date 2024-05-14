import process from "node:process"
import { setMigrationsComplete } from "../middleware/migrationCheck"
import { dmsDB } from '~/server/connectionPool'

export default defineNitroPlugin(() => {
  runMigrations()
})

async function runMigrations() {
  try {
    await dmsDB.migrate.latest()
    setMigrationsComplete(true)
    console.log('Migrations ran successfully.')
  } catch (error) {
    console.error('Error running migrations:', error)
    process.exit(1)
  }
}
