import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('COMPANY_INFO', (table) => {
    table.integer('logo_size').defaultTo(24)
    table.boolean('show_company_name').defaultTo(true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('COMPANY_INFO', (table) => {
    table.dropColumn('logo_size')
    table.dropColumn('show_company_name')
  })
}
