import { knex } from '../knexConfig'

// On server start-up, this plugin adds SHOWONSCREEN column to BFMASTERCOMMANDSALARMS table if it doesnt exist.
export default defineNitroPlugin(async () => {
  try {
    const alarmsHasShowColumn = await knex.schema.hasColumn('BFMASTERCOMMANDSALARMS', 'SHOWONSCREEN')

    if (!alarmsHasShowColumn) {
      await knex.schema.alterTable('BFMASTERCOMMANDSALARMS', (table) => {
        table.boolean('SHOWONSCREEN').defaultTo(true)
      })
      console.log('Column SHOWONSCREEN created successfully!')
    } else {
      // Synchronize
      await knex.schema.alterTable('BFMASTERCOMMANDSALARMS', (table) => {
        table.boolean('SHOWONSCREEN').alter().defaultTo(true)
      })
    }

    await knex('BFMASTERCOMMANDSALARMS')
      .update({ SHOWONSCREEN: true })
      .where('SHOWONSCREEN', null)

    console.log('Existing records updated successfully!')
  } catch (err) {
    console.error('Failed to migrate BFMASTERCOMMANDSALARMS', err)
  }
})
