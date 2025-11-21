import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('DISPENSER_MATERIAL_CONNECTION', (table) => {
    table.dropForeign(['material_code'], 'material')
  })
  await knex.schema.alterTable('DISPENSER_MATERIAL_CONNECTION', (table) => {
    table.foreign('material_code', 'material')
      .references('material_code')
      .inTable('MATERIAL')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })

  await knex.schema.alterTable('DUST_MATERIAL', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })
  await knex.schema.alterTable('DUST_MATERIAL', (table) => {
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })

  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })
  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })

  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })
  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (table) => {
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })

  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (table) => {
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })
  await knex.schema.alterTable('RECIPE_PROGRAM_MASTER_STEP', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })
  await knex.schema.alterTable('RECIPE_PROGRAM_MASTER_STEP', (table) => {
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })

  await knex.schema.alterTable('BATCH_RECIPE_STEP', (table) => {
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })

  await knex.schema.alterTable('MATERIAL_REQUEST', (table) => {
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('DISPENSER_MATERIAL_CONNECTION', (table) => {
    table.dropForeign(['material_code'], 'material')
  })
  await knex.schema.alterTable('DISPENSER_MATERIAL_CONNECTION', (table) => {
    table.foreign('material_code', 'material')
      .references('material_code')
      .inTable('MATERIAL')
  })

  await knex.schema.alterTable('DUST_MATERIAL', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })
  await knex.schema.alterTable('DUST_MATERIAL', (table) => {
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
  })

  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })
  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
  })

  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })
  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (table) => {
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
  })

  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (table) => {
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
  })
  await knex.schema.alterTable('RECIPE_PROGRAM_MASTER_STEP', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })
  await knex.schema.alterTable('RECIPE_PROGRAM_MASTER_STEP', (table) => {
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
  })

  await knex.schema.alterTable('BATCH_RECIPE_STEP', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })

  await knex.schema.alterTable('MATERIAL_REQUEST', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })
}
