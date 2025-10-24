import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('MACHINE', (table) => {
    table.decimal('capacity', 24, 4).defaultTo(-1)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('MACHINE', (table) => {
    table.dropColumn('capacity')
  })
}
