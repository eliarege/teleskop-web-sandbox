import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx.raw(`TRUNCATE TABLE "PROGRAM_TEMPLATE_STEP", "PROGRAM_TEMPLATE" RESTART IDENTITY CASCADE`)

    await trx.schema.alterTable('PROGRAM_TEMPLATE', (t) => {
      t.integer('machine_id').notNullable().alter()
      t.integer('program_no').notNullable().alter()
    })
    await trx.schema.alterTable('PROGRAM_TEMPLATE_STEP', (t) => {
      t.integer('machine_id').notNullable().alter()
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx.schema.alterTable('PROGRAM_TEMPLATE_STEP', (t) => {
      t.integer('machine_id').nullable().alter()
    })
    await trx.schema.alterTable('PROGRAM_TEMPLATE', (t) => {
      t.integer('machine_id').nullable().alter()
    })
  })
}
