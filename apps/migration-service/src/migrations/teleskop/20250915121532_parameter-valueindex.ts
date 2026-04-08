// VALUEINDEX column added for Tonello Integration
// We still check column existence if column was added manually before running this migration
import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const columnExists = await knex.schema.hasColumn('BFCOMMANDPARAMETERS', 'VALUEINDEX')
  if (!columnExists) {
    await knex.schema.alterTable('BFCOMMANDPARAMETERS', (table) => {
      table.integer('VALUEINDEX').nullable()
    })
  }
}

export async function down(knex: Knex) {
  const columnExists = await knex.schema.hasColumn('BFCOMMANDPARAMETERS', 'VALUEINDEX')
  if (columnExists) {
    await knex.schema.alterTable('BFCOMMANDPARAMETERS', (table) => {
      table.dropColumn('VALUEINDEX')
    })
  }
}
