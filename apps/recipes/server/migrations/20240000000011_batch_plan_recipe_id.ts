import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('BATCH_PLAN', (table) => {
    table.integer('recipe_id').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('BATCH_PLAN', (table) => {
    table.dropColumn('recipe_id')
  })
}
