import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('BATCH_PLAN', (table) => {
    table.integer('party_no').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('BATCH_PLAN', (table) => {
    table.dropColumn('party_no')
  })
}
