import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('RECIPE_CONTINUE_STEP')
  await knex.schema.dropTableIfExists('RECIPE_CONTINUE')
  
  await knex.schema.alterTable('RECIPE_MASTER_STEP', (t) => {
    t.dropForeign(['recipe_id'], 'fk_recipe_id')
  })
  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (t) => {
    t.dropForeign(['recipe_id'], 'fk_recipe_id')
  })
  await knex.schema.alterTable('RECIPE_VARIANT', (t) => {
    t.dropForeign(['recipe_id'], 'fk_recipe_id')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_STEP', (t) => {
    t.dropForeign(['recipe_id'], 'fk_recipe_id')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (t) => {
    t.dropForeign(['recipe_id'], 'fk_recipe_id')
  })

  await knex.schema.alterTable('RECIPE_MASTER_STEP', (t) => {
    t.integer('machine_id')
  })
  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (t) => {
    t.integer('machine_id')
  })
  await knex.schema.alterTable('RECIPE_VARIANT', (t) => {
    t.integer('machine_id')
  })
    await knex.schema.alterTable('RECIPE_VARIANT_STEP', (t) => {
    t.integer('machine_id')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (t) => {
    t.integer('machine_id')
  })

    await knex.raw(`
      UPDATE "RECIPE_MASTER_STEP" AS rms
      SET "machine_id" = rm."machine_id"
      FROM "RECIPE_MASTER" AS rm
      WHERE rm."recipe_id" = rms."recipe_id"
    `)
    await knex.raw(`
      UPDATE "RECIPE_MASTER_MATERIAL" AS rmm
      SET "machine_id" = rm."machine_id"
      FROM "RECIPE_MASTER" AS rm
      WHERE rm."recipe_id" = rmm."recipe_id"
    `)
    await knex.raw(`
      UPDATE "RECIPE_VARIANT" AS rv
      SET "machine_id" = rm."machine_id"
      FROM "RECIPE_MASTER" AS rm
      WHERE rm."recipe_id" = rv."recipe_id"
    `)
    await knex.raw(`
      UPDATE "RECIPE_VARIANT_STEP" AS rvs
      SET "machine_id" = rm."machine_id"
      FROM "RECIPE_MASTER" AS rm
      WHERE rm."recipe_id" = rvs."recipe_id"
    `)
    await knex.raw(`
      UPDATE "RECIPE_VARIANT_MATERIAL" AS rvm
      SET "machine_id" = rm."machine_id"
      FROM "RECIPE_MASTER" AS rm
      WHERE rm."recipe_id" = rvm."recipe_id"
    `)

  await knex.schema.alterTable('RECIPE_MASTER_STEP', (t) => {
    t.integer('machine_id').notNullable().alter()
  })
  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (t) => {
    t.integer('machine_id').notNullable().alter()
  })
  await knex.schema.alterTable('RECIPE_VARIANT', (t) => {
    t.integer('machine_id').notNullable().alter()
  })
  await knex.schema.alterTable('RECIPE_VARIANT_STEP', (t) => {
    t.integer('machine_id').notNullable().alter()
  })
  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (t) => {
    t.integer('machine_id').notNullable().alter()
  })


  await knex.schema.alterTable('RECIPE_MASTER', (t) => {
    t.integer('machine_id').notNullable().alter()
  })
  await knex.schema.alterTable('RECIPE_MASTER', (t) => {
    t.dropPrimary()
  })
  await knex.schema.alterTable('RECIPE_MASTER', (t) => {
    t.primary(['machine_id', 'recipe_id'])
  })

  await knex.schema.alterTable('RECIPE_MASTER_STEP', (t) => {
    t
      .foreign(['machine_id', 'recipe_id'], 'fk_recipe')
      .references(['machine_id', 'recipe_id'])
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
  })
  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (t) => {
    t
      .foreign(['machine_id', 'recipe_id'], 'fk_recipe')
      .references(['machine_id', 'recipe_id'])
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
  })
  await knex.schema.alterTable('RECIPE_VARIANT', (t) => {
    t
      .foreign(['machine_id', 'recipe_id'], 'fk_recipe')
      .references(['machine_id', 'recipe_id'])
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_STEP', (t) => {
    t
      .foreign(['machine_id', 'recipe_id'], 'fk_recipe')
      .references(['machine_id', 'recipe_id'])
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (t) => {
    t
      .foreign(['machine_id', 'recipe_id'], 'fk_recipe')
      .references(['machine_id', 'recipe_id'])
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('RECIPE_MASTER_STEP', (t) => {
    t.dropForeign(['machine_id', 'recipe_id'], 'fk_recipe')
  })
  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (t) => {
    t.dropForeign(['machine_id', 'recipe_id'], 'fk_recipe')
  })
  await knex.schema.alterTable('RECIPE_VARIANT', (t) => {
    t.dropForeign(['machine_id', 'recipe_id'], 'fk_recipe')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_STEP', (t) => {
    t.dropForeign(['machine_id', 'recipe_id'], 'fk_recipe')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (t) => {
    t.dropForeign(['machine_id', 'recipe_id'], 'fk_recipe')
  })

  await knex.schema.alterTable('RECIPE_MASTER', (t) => {
    t.dropPrimary()
  })
  await knex.schema.alterTable('RECIPE_MASTER', (t) => {
    t.primary(['recipe_id'])
  })
  await knex.schema.alterTable('RECIPE_MASTER_STEP', (t) => {
    t
      .foreign('recipe_id', 'fk_recipe_id')
      .references('recipe_id')
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
  })
  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (t) => {
    t
      .foreign('recipe_id', 'fk_recipe_id')
      .references('recipe_id')
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
  })
  await knex.schema.alterTable('RECIPE_VARIANT', (t) => {
    t
      .foreign('recipe_id', 'fk_recipe_id')
      .references('recipe_id')
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_STEP', (t) => {
    t
      .foreign('recipe_id', 'fk_recipe_id')
      .references('recipe_id')
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (t) => {
    t
      .foreign('recipe_id', 'fk_recipe_id')
      .references('recipe_id')
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
  })

  await knex.schema.alterTable('RECIPE_MASTER_STEP', (t) => {
    t.dropColumn('machine_id')
  })
  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (t) => {
    t.dropColumn('machine_id')
  })
  await knex.schema.alterTable('RECIPE_VARIANT', (t) => {
    t.dropColumn('machine_id')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_STEP', (t) => {
    t.dropColumn('machine_id')
  })
  await knex.schema.alterTable('RECIPE_VARIANT_MATERIAL', (t) => {
    t.dropColumn('machine_id')
  })
}
