import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PROGRAM_TEMPLATE' , (table) => {
    table.integer('machine_id')
    table.foreign('machine_id', 'fk_machine_id')
      .references('machine_id')
      .inTable('MACHINE')
  })
  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.integer('machine_id')
    table.foreign('machine_id', 'fk_machine_id')
      .references('machine_id')
      .inTable('MACHINE')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PROGRAM_TEMPLATE' , (table) => {
    table.dropForeign(['machine_id'], 'fk_machine_id')
    table.dropColumn('machine_id')
  })
  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP' , (table) => {
    table.dropForeign(['machine_id'], 'fk_machine_id')
    table.dropColumn('machine_id')
  })
}
