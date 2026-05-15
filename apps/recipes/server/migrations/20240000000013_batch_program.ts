import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('BATCH_PROGRAM', (table) => {
    table.integer('plan_key').notNullable()
    table.integer('program_index').notNullable()
    table.integer('program_no').notNullable()
    table.double('flotte').nullable()
    table.double('flotte_ratio').nullable()
    table.double('weight').nullable()
  })

  // Migrate existing data: one row per (plan_key, recipe_index) from BATCH_HEADER
  await knex.raw(`
    INSERT INTO "BATCH_PROGRAM" (plan_key, program_index, program_no, flotte, flotte_ratio, weight)
    SELECT DISTINCT ON (plan_key, recipe_index)
      plan_key, recipe_index, program_no, flotte, flotte_ratio, weight
    FROM "BATCH_HEADER"
    ORDER BY plan_key, recipe_index
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('BATCH_PROGRAM')
}
