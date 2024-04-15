import knex from 'knex'
import config from '../../knexfile'

export default defineNitroPlugin(() => {
  runMigrations()
})

async function runMigrations() {
  const db = knex(config.development)

  try {
    await db.migrate.latest()
    console.log('Migrations ran successfully.')
  } catch (error) {
    console.error('Error running migrations:', error)
  } finally {
    await db.destroy()
  }
}
