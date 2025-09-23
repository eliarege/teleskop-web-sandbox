// VALUEINDEX column added for Tonello Integration
// We still check column existence if column was added manually before running this migration
import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const bfColumnExists = await knex.schema.hasColumn('BFCOMMANDPARAMETERS', 'VALUEINDEX')
  const baColumnExists = await knex.schema.hasColumn('BACOMMANDPARAMETERS', 'VALUEINDEX')

  if (!bfColumnExists) {
    await knex.schema.alterTable('BFCOMMANDPARAMETERS', (table) => {
      table.integer('VALUEINDEX').nullable()
    })
  }

  if (!baColumnExists) {
    await knex.schema.alterTable('BACOMMANDPARAMETERS', (table) => {
      table.integer('VALUEINDEX').nullable()
    })
  }
}

export async function down(knex: Knex) {
  const bfColumnExists = await knex.schema.hasColumn('BFCOMMANDPARAMETERS', 'VALUEINDEX')
  const baColumnExists = await knex.schema.hasColumn('BACOMMANDPARAMETERS', 'VALUEINDEX')

  if (bfColumnExists) {
    await knex.schema.alterTable('BFCOMMANDPARAMETERS', (table) => {
      table.dropColumn('VALUEINDEX')
    })
  }

  if (baColumnExists) {
    await knex.schema.alterTable('BACOMMANDPARAMETERS', (table) => {
      table.dropColumn('VALUEINDEX')
    })
  }
}
