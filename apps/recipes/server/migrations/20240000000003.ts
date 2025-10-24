import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('BATCH_RECIPE_STEP', (table) => {
    table.integer('recipe_type').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('BATCH_RECIPE_STEP', (table) => {
    table.dropColumn('recipe_type')
  })
}
