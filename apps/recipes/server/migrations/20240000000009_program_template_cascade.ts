import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PROGRAM_TEMPLATE', (table) => {
    table.dropForeign(['machine_id'], 'fk_machine_id')
  })
  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.dropForeign(['machine_id'], 'fk_machine_id')
  })

  await knex.schema.alterTable('PROGRAM_TEMPLATE', (table) => {
    table.foreign(['program_no', 'machine_id'], 'fk_program_header')
      .references(['program_no', 'machine_id'])
      .inTable('PROGRAM_HEADER')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })
  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.foreign(['program_no', 'machine_id'], 'fk_program_header')
      .references(['program_no', 'machine_id'])
      .inTable('PROGRAM_HEADER')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PROGRAM_TEMPLATE', (table) => {
    table.dropForeign(['program_no', 'machine_id'], 'fk_program_header')
  })
  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.dropForeign(['program_no', 'machine_id'], 'fk_program_header')
  })

  await knex.schema.alterTable('PROGRAM_TEMPLATE', (table) => {
    table.foreign('machine_id', 'fk_machine_id')
      .references('machine_id')
      .inTable('MACHINE')
  })
  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.foreign('machine_id', 'fk_machine_id')
      .references('machine_id')
      .inTable('MACHINE')
  })
}
