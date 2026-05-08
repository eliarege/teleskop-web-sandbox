import type { Knex } from 'knex'

export async function up(knex: Knex) {
  await knex.schema.alterTable('BASTARTEND', (table) => {
    table.integer('TOTALREQUESTCOUNT').alter()
  })
}

export async function down(knex: Knex) {
  await knex.schema.alterTable('BASTARTEND', (table) => {
    table.tinyint('TOTALREQUESTCOUNT').alter()
  })
}
