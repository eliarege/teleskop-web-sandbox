import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    ALTER TABLE "BATCH_PLAN"
    ALTER COLUMN "as_no" TYPE text
    USING "as_no"::text;
  `)

  await knex.schema.alterTable('BATCH_HEADER', (table) => {
    table.renameColumn('total_weight', 'weight')
  })
}

export async function down(knex: Knex): Promise<void> {
  // (will fail if non‑numeric data remain)
  await knex.schema.raw(`
    ALTER TABLE "BATCH_PLAN"
    ALTER COLUMN "as_no" TYPE integer
    USING "as_no"::integer;
  `)

  await knex.schema.alterTable('BATCH_HEADER', (table) => {
    table.renameColumn('weight', 'total_weight')
  })
}
