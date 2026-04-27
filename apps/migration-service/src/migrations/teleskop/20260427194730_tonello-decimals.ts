import type { Knex } from 'knex'

const commandParameter = 'BFCOMMANDPARAMETERS'
const commandParameterArchive = 'BACOMMANDPARAMETERS'
const decimals = 'DECIMALS'

export async function up(knex: Knex) {
  const bfColumnExists = await knex.schema.hasColumn(commandParameter, decimals)
  const baColumnExists = await knex.schema.hasColumn(commandParameterArchive, decimals)

  if (!bfColumnExists) {
    await knex.schema.alterTable(commandParameter, (table) => {
      table.integer(decimals).nullable()
    })
  }

  if (!baColumnExists) {
    await knex.schema.alterTable(commandParameterArchive, (table) => {
      table.integer(decimals).nullable()
    })
  }
}

export async function down(knex: Knex) {
  const bfColumnExists = await knex.schema.hasColumn(commandParameter, decimals)
  const baColumnExists = await knex.schema.hasColumn(commandParameterArchive, decimals)

  if (bfColumnExists) {
    await knex.schema.alterTable(commandParameter, (table) => {
      table.dropColumn(decimals)
    })
  }

  if (baColumnExists) {
    await knex.schema.alterTable(commandParameterArchive, (table) => {
      table.dropColumn(decimals)
    })
  }
}
