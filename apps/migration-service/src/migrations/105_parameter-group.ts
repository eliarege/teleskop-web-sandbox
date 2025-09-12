// Used for tonello integration
import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const columns = await knex('BFCOMMANDPARAMETERS').columnInfo()

  if (!columns.PARAMETERGROUP) {
    await knex.schema.alterTable('BFCOMMANDPARAMETERS', (table) => {
      table.integer('PARAMETERGROUP').nullable()
    })
  }
}

export async function down(knex: Knex) {
  const columns = await knex('BFCOMMANDPARAMETERS').columnInfo()

  if (columns.PARAMETERGROUP) {
    await knex.schema.alterTable('BFCOMMANDPARAMETERS', (table) => {
      table.dropColumn('PARAMETERGROUP')
    })
  }
}
