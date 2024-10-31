import { knex } from '../knexConfig'

export default defineNitroPlugin(async () => {
  const alarmsHasShowColumn = await knex.schema.hasColumn('BFMASTERCOMMANDSALARMS', 'SHOWONSCREEN')
  if (!alarmsHasShowColumn) {
    await knex.schema.alterTable('BFMASTERCOMMANDSALARMS', (table) => {
      table.boolean('SHOWONSCREEN').defaultTo(true)
    })
      .then(() => console.log('Column SHOWONSCREEN created successfully!'))
      .catch(err => console.error('An error occurred while creating column SHOWONSCREEN', err))

    await knex('BFMASTERCOMMANDSALARMS').update({ SHOWONSCREEN: true }).where('SHOWONSCREEN', null)
      .then(() => console.log('Existing records updated successfully!'))
      .catch(err => console.error('An error occurred while updating records', err))
  } else {
    await knex.schema.alterTable('BFMASTERCOMMANDSALARMS', (table) => {
      table.boolean('SHOWONSCREEN').alter().defaultTo(true)
    })
    await knex('BFMASTERCOMMANDSALARMS').update({ SHOWONSCREEN: true }).where('SHOWONSCREEN', null)
      .then(() => console.log('Existing records updated successfully!'))
      .catch(err => console.error('An error occurred while updating records', err))
  }
})
