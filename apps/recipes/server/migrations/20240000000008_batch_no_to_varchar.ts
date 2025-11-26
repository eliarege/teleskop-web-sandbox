import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('JOB_ORDER', (table) => {
    table.string('batch_no', 50).alter()
  })

  await knex.schema.alterTable('BATCH_PLAN', (table) => {
    table.string('batch', 50).alter()
  })

  // Find current max batch number from existing data
  const maxBatch = await knex('JOB_ORDER')
    .select('batch_no')
    .orderBy('batch_no', 'desc')
    .first()

  let initialValue = 1
  if (maxBatch?.batch_no) {
    const numericMatch = String(maxBatch.batch_no).match(/^(\d+)/)
    if (numericMatch) {
      initialValue = Number.parseInt(numericMatch[1], 10) + 1
    }
  }

  await knex.raw(`CREATE SEQUENCE IF NOT EXISTS batch_number_seq START WITH ${initialValue}`)
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP SEQUENCE IF EXISTS batch_number_seq')

  await knex.schema.alterTable('JOB_ORDER', (table) => {
    table.integer('batch_no').alter()
  })

  await knex.schema.alterTable('BATCH_PLAN', (table) => {
    table.integer('batch').alter()
  })
}
