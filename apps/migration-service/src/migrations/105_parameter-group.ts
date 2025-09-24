// Used for tonello integration
import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const bfColumnExists = await knex.schema.hasColumn('BFCOMMANDPARAMETERS', 'PARAMETERGROUP')
  const baColumnExists = await knex.schema.hasColumn('BACOMMANDPARAMETERS', 'PARAMETERGROUP')

  if (!bfColumnExists) {
    await knex.schema.alterTable('BFCOMMANDPARAMETERS', (table) => {
      table.integer('PARAMETERGROUP').nullable()
    })
  }

  if (!baColumnExists) {
    await knex.schema.alterTable('BACOMMANDPARAMETERS', (table) => {
      table.integer('PARAMETERGROUP').nullable()
    })
  }
}

export async function down(knex: Knex) {
  const bfColumnExists = await knex.schema.hasColumn('BFCOMMANDPARAMETERS', 'PARAMETERGROUP')
  const baColumnExists = await knex.schema.hasColumn('BACOMMANDPARAMETERS', 'PARAMETERGROUP')

  if (bfColumnExists) {
    await knex.schema.alterTable('BFCOMMANDPARAMETERS', (table) => {
      table.dropColumn('PARAMETERGROUP')
    })
  }

  if (baColumnExists) {
    await knex.schema.alterTable('BACOMMANDPARAMETERS', (table) => {
      table.dropColumn('PARAMETERGROUP')
    })
  }
}
