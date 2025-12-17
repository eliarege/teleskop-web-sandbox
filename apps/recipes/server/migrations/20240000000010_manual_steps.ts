import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Add next_step column to RECIPE_MASTER_MATERIAL
  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (table) => {
    table.integer('next_step').nullable()
  })

  // Add next_step column to RECIPE_VARIANT_MATERIAL
  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (table) => {
    table.integer('next_step').nullable()
  })

  // Add next_step column to PROGRAM_TEMPLATE_STEP
  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.integer('next_step').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (table) => {
    table.dropColumn('next_step')
  })

  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (table) => {
    table.dropColumn('next_step')
  })

  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.dropColumn('next_step')
  })
}
