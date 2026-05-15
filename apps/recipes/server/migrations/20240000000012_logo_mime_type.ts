import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('COMPANY_INFO', (table) => {
    table.text('logo_mime_type')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('COMPANY_INFO', (table) => {
    table.dropColumn('logo_mime_type')
  })
}
