import type { Knex } from 'knex'

const tableName = 'BACHEMICALREQUEST'
const columnName = 'TonelloEvent'


export async function up(knex: Knex) {
  const hasColumn = await knex.schema.hasColumn(tableName, columnName)
  if (!hasColumn) {
    await knex.schema.alterTable(tableName, (table) => {
      table.text(columnName).nullable()
    })
  }
}

export async function down(knex: Knex) {
  const hasColumn = await knex.schema.hasColumn(tableName, columnName)
  if (hasColumn) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn(columnName)
    })
  }
}
