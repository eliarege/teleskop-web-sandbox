import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('MACHINE_GROUP', (table) => {
    table.integer('machine_id').primary()
    table.foreign('machine_id', 'fk_machine_id')
      .references('machine_id')
      .inTable('MACHINE')
    table.integer('group_id')
  })
  await knex.schema.createTable('MACHINE_COMMAND', (table) => {
    table.integer('machine_id')
    table.primary(['machine_id', 'command_no'])
    table.integer('command_no')
    table.text('command_name')
  })
  await knex.schema.createTable('MACHINE_COMMAND_PARAMETER', (table) => {
    table.integer('machine_id')
    table.integer('command_no')
    table.integer('parameter_index')
    table.primary(['machine_id', 'command_no', 'parameter_index'])
    table.text('parameter_name')
    table.text('value')
  })
  await knex.schema.createTable('PARAMETER_GROUP', (table) => {
    table.increments('group_id').primary()
    table.text('group_name')
  })
  await knex.schema.createTable('PROGRAM_STEP', (table) => {
    table.integer('machine_id')
    table.integer('program_no')
    table.primary(['machine_id', 'program_no', 'main_step', 'parallel_step'])
    table.integer('main_step')
    table.integer('parallel_step')
    table.integer('command_no')
  })
  await knex.schema.createTable('OPTIMIZATION_PARAMETER', (table) => {
    table.increments('param_id').primary()
    table.text('param_name')
    table.integer('min_value')
    table.integer('max_value')
    table.integer('unit')
  })
  await knex.schema.createTable('OPTIMIZATION_PARAMETER_MAP', (table) => {
    table.integer('param_id')
    table.integer('group_id')
    table.primary(['param_id', 'group_id'])
    table.integer('command_no')
    table.integer('parameter_index')
  })
  await knex.schema.createTable('STEP_PARAMETER', (table) => {
    table.integer('machine_id')
    table.integer('program_no')
    table.foreign('program_no')
    table.integer('main_step')
    table.integer('parallel_step')
    table.integer('param_index')
    table.boolean('optimized')
    table.integer('optimized_value')
    table.text('value')
    table.primary(['machine_id', 'program_no', 'main_step', 'parallel_step', 'param_index'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('MACHINE_GROUP', (table) => {
    table.dropForeign(['machine_id'], 'fk_machine_id')
  })
  await knex.schema.dropTableIfExists('MACHINE_GROUP')
  await knex.schema.dropTableIfExists('MACHINE_COMMAND')
  await knex.schema.dropTableIfExists('MACHINE_COMMAND_PARAMETER')
  await knex.schema.dropTableIfExists('PARAMETER_GROUP')
  await knex.schema.dropTableIfExists('PROGRAM_STEP')
  await knex.schema.dropTableIfExists('OPTIMIZATION_PARAMETER')
  await knex.schema.dropTableIfExists('OPTIMIZATION_PARAMETER_MAP')
  await knex.schema.dropTableIfExists('STEP_PARAMETER')
}
