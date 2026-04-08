// We forgot to add the archive variants of these columns in a previous migration
import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const columnInfo = await knex('BACOMMANDPARAMETERS').columnInfo()
  if (columnInfo.VALUEINDEX && columnInfo.PARAMETERGROUP) {
    return
  }

  await knex.schema.alterTable('BACOMMANDPARAMETERS', (table) => {
    if (!columnInfo.VALUEINDEX) {
      table.integer('VALUEINDEX').nullable()
    }
    if (!columnInfo.PARAMETERGROUP) {
      table.integer('PARAMETERGROUP').nullable()
    }
  })
}

export async function down(knex: Knex) {
  const columnInfo = await knex('BACOMMANDPARAMETERS').columnInfo()
  if (!columnInfo.VALUEINDEX && !columnInfo.PARAMETERGROUP) {
    return
  }

  await knex.schema.alterTable('BACOMMANDPARAMETERS', (table) => {
    if (columnInfo.VALUEINDEX) {
      table.dropColumn('VALUEINDEX')
    }
    if (columnInfo.PARAMETERGROUP) {
      table.dropColumn('PARAMETERGROUP')
    }
  })
}
