// Used for tonello integration
import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const columnExists = await knex.schema.hasColumn('BFCOMMANDPARAMETERS', 'PARAMETERGROUP')

  if (!columnExists) {
    await knex.schema.alterTable('BFCOMMANDPARAMETERS', (table) => {
      table.integer('PARAMETERGROUP').nullable()
    })
  }
}

export async function down(knex: Knex) {
  const columnExists = await knex.schema.hasColumn('BFCOMMANDPARAMETERS', 'PARAMETERGROUP')

  if (columnExists) {
    await knex.schema.alterTable('BFCOMMANDPARAMETERS', (table) => {
      table.dropColumn('PARAMETERGROUP')
    })
  }
}
