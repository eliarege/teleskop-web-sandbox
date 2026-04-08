import type { Knex } from 'knex'

export async function up(knex: Knex) {
  await knex.schema.alterTable('BACOMMANDPARAMETERS', (table) => {
    table.string('PARAMSTRING', 100).alter()
  })
}

export async function down() {
  // Down migration not implemented
}
