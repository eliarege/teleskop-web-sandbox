import type { Knex } from 'knex'

// Refactor PROGRAM_TEMPLATE_STEP from one-row-per-material to one-row-per-step,
// moving material details into a new PROGRAM_TEMPLATE_STEP_MATERIAL table.
// This allows steps to exist without any materials, which is required to
// represent the orderNo of each chemical/dye/salt request independently of
// whether the request has materials authored in the recipes app yet.
export async function up(knex: Knex): Promise<void> {
  // 1. Create the new material table (step_id is nullable until backfilled & FK added).
  await knex.schema.createTable('PROGRAM_TEMPLATE_STEP_MATERIAL', (table) => {
    table.increments('id').primary()
    table.integer('step_id')
    table.text('material_code')
    table.integer('unit')
    table.double('amount')
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })

  // 2. Create a step-level staging table for PROGRAM_TEMPLATE_STEP (new shape).
  await knex.schema.createTable('PROGRAM_TEMPLATE_STEP_NEW', (table) => {
    table.increments('id').primary()
    table.integer('program_no').notNullable()
    table.integer('machine_id').notNullable()
    table.integer('type')
    table.integer('step_no')
    table.integer('next_step').nullable()
    table.foreign('machine_id', 'fk_machine_id')
      .references('machine_id')
      .inTable('MACHINE')
    table.foreign(['program_no', 'machine_id'], 'fk_program_header')
      .references(['program_no', 'machine_id'])
      .inTable('PROGRAM_HEADER')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })

  // 3. Backfill step rows: one row per distinct (program_no, machine_id, type, step_no, next_step).
  await knex.raw(`
    INSERT INTO "PROGRAM_TEMPLATE_STEP_NEW" ("program_no", "machine_id", "type", "step_no", "next_step")
    SELECT DISTINCT ON ("program_no", "machine_id", "type", "step_no", "next_step")
           "program_no", "machine_id", "type", "step_no", "next_step"
    FROM "PROGRAM_TEMPLATE_STEP"
    ORDER BY "program_no", "machine_id", "type", "step_no", "next_step"
  `)

  // 4. Backfill material rows, resolving step_id by joining on the (now step-level) staging table.
  await knex.raw(`
    INSERT INTO "PROGRAM_TEMPLATE_STEP_MATERIAL" ("step_id", "material_code", "unit", "amount")
    SELECT n."id", o."material_code", o."unit", o."amount"
    FROM "PROGRAM_TEMPLATE_STEP" o
    JOIN "PROGRAM_TEMPLATE_STEP_NEW" n
      ON o."program_no" = n."program_no"
     AND o."machine_id" = n."machine_id"
     AND o."type" = n."type"
     AND o."step_no" = n."step_no"
     AND (o."next_step" IS NOT DISTINCT FROM n."next_step")
  `)

  // 5. Drop the old per-material PROGRAM_TEMPLATE_STEP table.
  await knex.schema.dropTableIfExists('PROGRAM_TEMPLATE_STEP')

  // 6. Promote the staging table to the production name.
  await knex.schema.renameTable('PROGRAM_TEMPLATE_STEP_NEW', 'PROGRAM_TEMPLATE_STEP')

  // 7. Make step_id NOT NULL and add the FK to PROGRAM_TEMPLATE_STEP with CASCADE.
  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP_MATERIAL', (table) => {
    table.integer('step_id').notNullable().alter()
  })
  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP_MATERIAL', (table) => {
    table.foreign('step_id', 'fk_step_id')
      .references('id')
      .inTable('PROGRAM_TEMPLATE_STEP')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
    table.index('step_id', 'idx_program_template_step_material_step_id')
  })

  // 8. Drop the old PROGRAM_TEMPLATE table, which is no longer used.
  await knex.schema.dropTableIfExists('PROGRAM_TEMPLATE')
}

export async function down(knex: Knex): Promise<void> {
  // 1. Recreate the old per-material shape under a temporary name.
  await knex.schema.createTable('PROGRAM_TEMPLATE_STEP_OLD', (table) => {
    table.text('material_code')
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
    table.integer('program_no')
    table.integer('step_no')
    table.integer('type')
    table.integer('unit')
    table.double('amount')
    table.integer('machine_id').notNullable()
    table.integer('next_step').nullable()
    table.foreign('machine_id', 'fk_machine_id')
      .references('machine_id')
      .inTable('MACHINE')
    table.foreign(['program_no', 'machine_id'], 'fk_program_header')
      .references(['program_no', 'machine_id'])
      .inTable('PROGRAM_HEADER')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })

  // 2. Backfill one row per material by joining the step-level table with the material table.
  await knex.raw(`
    INSERT INTO "PROGRAM_TEMPLATE_STEP_OLD" ("material_code", "program_no", "step_no", "type", "unit", "amount", "machine_id", "next_step")
    SELECT m."material_code", s."program_no", s."step_no", s."type", m."unit", m."amount", s."machine_id", s."next_step"
    FROM "PROGRAM_TEMPLATE_STEP_MATERIAL" m
    JOIN "PROGRAM_TEMPLATE_STEP" s ON m."step_id" = s."id"
  `)

  // 3. Drop the material table (drops its step_id FK along with it).
  await knex.schema.dropTableIfExists('PROGRAM_TEMPLATE_STEP_MATERIAL')

  // 4. Drop the step-level table.
  await knex.schema.dropTableIfExists('PROGRAM_TEMPLATE_STEP')

  // 5. Restore the production name.
  await knex.schema.renameTable('PROGRAM_TEMPLATE_STEP_OLD', 'PROGRAM_TEMPLATE_STEP')

  // 6. Recreate the old PROGRAM_TEMPLATE table, which is no longer used.
  await knex.schema.createTable('PROGRAM_TEMPLATE', (table) => {
    table.integer('program_no')
    table.integer('machine_id').notNullable()
    table.integer('type')
    table.foreign('machine_id', 'fk_machine_id')
      .references('machine_id')
      .inTable('MACHINE')
    table.foreign(['program_no', 'machine_id'], 'fk_program_header')
      .references(['program_no', 'machine_id'])
      .inTable('PROGRAM_HEADER')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })

  await knex.raw(`
    INSERT INTO "PROGRAM_TEMPLATE" ("program_no", "machine_id", "type")
    SELECT DISTINCT "program_no", "machine_id", "type"
    FROM "PROGRAM_TEMPLATE_STEP"
  `)
}
