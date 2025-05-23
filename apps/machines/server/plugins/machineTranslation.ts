import { knex } from '../connectionPool'

export default defineNitroPlugin(async () => {
  try {
    const hasMachineTranslationTable = await knex.schema.hasTable('BFMACHINETRANSLATIONS')
    if (!hasMachineTranslationTable) {
      await knex.schema.createTable('BFMACHINETRANSLATIONS', (table) => {
        table.integer('machine_id').notNullable()
        table.integer('from_locale').notNullable()
        table.integer('to_locale').notNullable()
        table.jsonb('messages').notNullable()
      })
      console.log('table BFMACHINETRANSLATIONS created successfully!')
    }
  } catch (err) {
    console.error('Failed to create BFMACHINETRANSLATIONS table:', err)
  }
})
