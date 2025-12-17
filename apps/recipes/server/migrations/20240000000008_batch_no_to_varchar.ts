import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('JOB_ORDER', (table) => {
    table.string('batch_no', 50).alter()
  })

  await knex.schema.alterTable('BATCH_PLAN', (table) => {
    table.string('batch', 50).alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('JOB_ORDER', (table) => {
    table.integer('batch_no').alter()
  })

  await knex.schema.alterTable('BATCH_PLAN', (table) => {
    table.integer('batch').alter()
  })
}
