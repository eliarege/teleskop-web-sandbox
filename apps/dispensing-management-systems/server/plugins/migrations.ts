import { dmsDB } from '~/server/connectionPool'

export default defineNitroPlugin(() => {
  runMigrations()
})

async function runMigrations() {
  try {
    await dmsDB.migrate.latest()
    console.log('Migrations ran successfully.')
  } catch (error) {
    console.error('Error running migrations:', error)
  }
}
