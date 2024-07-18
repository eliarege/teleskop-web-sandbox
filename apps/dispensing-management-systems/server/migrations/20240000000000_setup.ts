import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Tables
  await knex.schema.createTable('BATCH_HEADER', (table) => {
    table.integer('plan_key')
    table.integer('recipe_index')
    table.integer('recipe_no')
    table.integer('recipe_type')
  })

  await knex.schema.createTable('BATCH_PLAN', (table) => {
    table.increments('plan_key')
    table.text('batch')
    table.integer('batch_correction_no')
    table.integer('planned_machine')
    table.timestamp('planned_start_date', { useTz: true })
  })

  await knex.schema.createTable('BATCH_PLAN_PARAMETER', (table) => {
    table.integer('plan_key')
    table.integer('param_id')
    table.text('param_name')
    table.text('value')
    table.integer('param_type')
    table.integer('unit')
  })

  await knex.schema.createTable('BATCH_RECIPE_STEP', (table) => {
    table.integer('plan_key')
    table.integer('main_step')
    table.integer('parallel_step')
    table.integer('req_no_batch')
    table.integer('process_order')
    table.text('material_code')
    table.integer('prog_proc_no')
    table.double('amount')
    table.integer('unit').defaultTo(3)
    table.text('batch_order')
  })

  await knex.schema.createTable('MACHINE', (table) => {
    table.increments('machine_id')
    table.text('machine_name')
    table.integer('controller_type')
  })

  await knex.schema.createTable('COMMAND_TYPE', (table) => {
    table.integer('machine_id')
    table.foreign('machine_id', 'fk_machine')
      .references('machine_id')
      .inTable('MACHINE')
    table.integer('command_type')
    table.integer('command_no')
  })
  await knex.schema.createTable('DISPENSER', (table) => {
    table.increments('dispenser_id')
    table.text('dispenser_name')
    table.text('ip_address')
    table.text('vnc_password')
    table.text('protocol')
    table.integer('dispenser_type')
    table.timestamp('last_consumption_control', { precision: 6, useTz: true })
    table.json('protocol_fields')
    table.text('vnc_user')
    table.integer('vnc_port')
    table.specificType('jdm_connections', 'integer[]')
  })

  await knex.schema.createTable('DISPENSER_BRAND', (table) => {
    table.increments('brand_id')
    table.text('brand_name')
  })

  await knex.schema.createTable('DISPENSER_MACHINE_CONNECTION', (table) => {
    table.integer('dispenser_id')
    table.foreign('dispenser_id', 'fk_dispenser')
      .references('dispenser_id')
      .inTable('DISPENSER')
    table.integer('machine_id')
    table.foreign('machine_id', 'fk_machine')
      .references('machine_id')
      .inTable('MACHINE')
    table.primary(['dispenser_id', 'machine_id'])
  })

  await knex.schema.createTable('DISPENSER_MATERIAL_CONNECTION', (table) => {
    table.integer('dispenser_id')
    table.foreign('dispenser_id', 'dispenser')
      .references('dispenser_id')
      .inTable('DISPENSER')
    table.text('material_code')
    table.foreign('material_code', 'material')
      .references('material_code')
      .inTable('MATERIAL')
    table.primary(['dispenser_id', 'material_code'])
  })

  await knex.schema.createTable('DISPENSER_TYPE', (table) => {
    table.increments('dispenser_type_id')
    table.text('dispenser_type_name')
    table.integer('dispenser_brand_id')
  })

  await knex.schema.createTable('DUST_MATERIAL', (table) => {
    table.integer('req_no')
    table.text('material_code')
    table.foreign('material_code', 'fk_material')
      .references('material_code')
      .inTable('MATERIAL')
    table.double('recipe_amount')
    table.double('real_amount')
    table.integer('main_step')
    table.integer('parallel_step')
  })

  await knex.schema.createTable('DUST_MATERIAL_REQUEST', (table) => {
    table.increments('req_no')
    table.text('batch_no')
    table.integer('queue_no')
    table.integer('recipe_type')
    table.integer('dispenser_id')
    table.foreign('dispenser_id', 'fk_dispenser')
      .references('dispenser_id')
      .inTable('DISPENSER')
    table.timestamp('request_time', { precision: 6, useTz: true })
    table.integer('status')
    table.integer('correction_no')
    table.integer('recipe_index')
    table.integer('machine_id')
    table.foreign('machine_id', 'fk_machine')
      .references('machine_id')
      .inTable('MACHINE')
  })

  await knex.schema.createTable('JOB_ORDER', (table) => {
    table.integer('batch_correction_no')
    table.integer('tank_no')
    table.integer('program_no')
    table.integer('recipe_process_no')
    table.integer('recipe_step_no')
    table.increments('job_id')
    table.integer('step_no')
    table.integer('dispenser_id')
    table.foreign('dispenser_id', 'fk_dispenser')
      .references('dispenser_id')
      .inTable('DISPENSER')
    table.integer('machine_id')
    table.foreign('machine_id', 'fk_machine')
      .references('machine_id')
      .inTable('MACHINE')
    table.smallint('status')
    table.smallint('recipe_type')
    table.integer('batch_no')
    table.timestamp('request_time', { precision: 6, useTz: true })
    table.timestamp('completed_time', { precision: 6, useTz: true })
    table.integer('priority').defaultTo(50)
  })

  await knex.schema.createTable('MACHINE_CONTROLLER_TYPE', (table) => {
    table.integer('controller_type_id')
    table.text('controller_type_name')
  })

  await knex.schema.createTable('MATERIAL', (table) => {
    table.text('material_code').notNullable().primary()
    table.text('material_name')
    table.double('ph')
    table.double('density')
    table.integer('material_group_no')
    table.boolean('re_requestable').defaultTo(false)
    table.boolean('direct_transfer').defaultTo(false)
    table.text('cost_unit')
    table.double('unit_cost')
    table.text('source')
  })

  await knex.schema.createTable('MATERIAL_REQUEST', (table) => {
    table.integer('req_no')
    table.double('recipe_amount')
    table.integer('status')
    table.text('material_code')
    table.integer('unit').defaultTo(3)
    table.double('real_amount')
    table.integer('main_step')
    table.integer('parallel_step')
    table.integer('dispenser_id')
    table.foreign('dispenser_id', 'fk_dispenser')
      .references('dispenser_id')
      .inTable('DISPENSER')
  })
  await knex.schema.createTable('MASTER_COMMAND', (table) => {
    table.integer('machine_id')
    table.foreign('machine_id', 'fk_machine')
      .references('machine_id')
      .inTable('MACHINE')
    table.integer('command_no')
    table.text('command_name')
  })
  await knex.schema.createTable('PROGRAM_HEADER', (table) => {
    table.integer('machine_id')
    table.integer('program_no')
    table.text('program_name')
  })

  await knex.schema.createTable('PROTOCOL', (table) => {
    table.integer('dispenser_brand_id')
    table.foreign('dispenser_brand_id', 'fk_dispenser_brand')
      .references('brand_id')
      .inTable('DISPENSER_BRAND')
    table.text('protocol')
    table.specificType('fields', 'text[]')
  })

  await knex.schema.createTable('RECIPE_MASTER', (table) => {
    table.increments('recipe_id')
    table.text('recipe_name')
    table.integer('recipe_group')
    table.text('recipe_comment')
    table.integer('recipe_type')
    table.timestamp('prep_time', { precision: 6, useTz: true })
    table.timestamp('last_update', { precision: 6, useTz: true })
    table.integer('step_no')
    table.integer('program_no')
    table.boolean('is_passive')
  })

  await knex.schema.createTable('RECIPE_MASTER_STEP', (table) => {
    table.increments('recipe_master_id')
    table.foreign('recipe_master_id', 'fk_recipe_master').references('recipe_id').inTable('RECIPE_MASTER')
    table.integer('material_code').notNullable()
    table.foreign('material_code', 'fk_material_code').references('material_code').inTable('MATERIAL')
    table.integer('main_step')
    table.integer('parallel_step')
    table.integer('unit').defaultTo(3)
    table.double('amount')
  })

  await knex.schema.createTable('TELESKOP_SETTINGS', (table) => {
    table.text('user')
    table.text('password')
    table.text('database')
    table.text('host')
    table.integer('port')
    table.text('client')
    table.text('host_computer')
  })

  // Functions
  await knex.raw(`
    CREATE FUNCTION public.trg_adjust_dispenser_id_seq() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        PERFORM nextval('DISPENSER_dispenser_id_seq');

        IF NEW.dispenser_id >= currval('DISPENSER_dispenser_id_seq') THEN
            PERFORM setval('DISPENSER_dispenser_id_seq', NEW.dispenser_id + 1);
        END IF;

        RETURN NEW;
    END;
    $$;
  `)

  await knex.raw(`
    CREATE FUNCTION public.trg_adjust_machine_id_seq() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        PERFORM nextval('MACHINE_machine_id_seq');

        IF NEW.machine_id >= currval('MACHINE_machine_id_seq') THEN
            PERFORM setval('MACHINE_machine_id_seq', NEW.machine_id + 1);
        END IF;

        -- Return the new row for insertion
        RETURN NEW;
    END;
    $$;
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('DISPENSER_MACHINE_CONNECTION', (table) => {
    table.dropForeign(['dispenser_id'], 'fk_dispenser')
    table.dropForeign(['machine_id'], 'fk_machine')
  })

  await knex.schema.alterTable('DISPENSER_MATERIAL_CONNECTION', (table) => {
    table.dropForeign(['dispenser_id'], 'dispenser')
    table.dropForeign(['material_code'], 'material')
  })

  await knex.schema.alterTable('DUST_MATERIAL', (table) => {
    table.dropForeign(['material_code'], 'fk_material')
  })

  await knex.schema.alterTable('DUST_MATERIAL_REQUEST', (table) => {
    table.dropForeign(['dispenser_id'], 'fk_dispenser')
    table.dropForeign(['machine_id'], 'fk_machine')
  })

  await knex.schema.alterTable('JOB_ORDER', (table) => {
    table.dropForeign(['dispenser_id'], 'fk_dispenser')
    table.dropForeign(['machine_id'], 'fk_machine')
  })

  await knex.schema.alterTable('MATERIAL_REQUEST', (table) => {
    table.dropForeign(['dispenser_id'], 'fk_dispenser')
  })

  await knex.schema.alterTable('PROTOCOL', (table) => {
    table.dropForeign(['dispenser_brand_id'], 'fk_dispenser_brand')
  })

  await knex.schema.alterTable('RECIPE_MASTER', (table) => {
    table.dropForeign(['machine_id'], 'recipe_master_machine_id_foreign')
  })
  await knex.schema.alterTable('RECIPE_MASTER_STEP', (table) => {
    table.dropForeign(['recipe_master_id'], 'recipe_master_step_fk')
  })
  await knex.schema.dropTableIfExists('TELESKOP_SETTINGS')
  await knex.schema.dropTableIfExists('RECIPE_MASTER')
  await knex.schema.dropTableIfExists('PROTOCOL')
  await knex.schema.dropTableIfExists('PROGRAM_HEADER')
  await knex.schema.dropTableIfExists('MATERIAL_REQUEST')
  await knex.schema.dropTableIfExists('MATERIAL')
  await knex.schema.dropTableIfExists('MACHINE_CONTROLLER_TYPE')
  await knex.schema.dropTableIfExists('MACHINE')
  await knex.schema.dropTableIfExists('JOB_ORDER')
  await knex.schema.dropTableIfExists('DUST_MATERIAL_REQUEST')
  await knex.schema.dropTableIfExists('DUST_MATERIAL')
  await knex.schema.dropTableIfExists('DISPENSER_TYPE')
  await knex.schema.dropTableIfExists('DISPENSER_MATERIAL_CONNECTION')
  await knex.schema.dropTableIfExists('DISPENSER_MACHINE_CONNECTION')
  await knex.schema.dropTableIfExists('DISPENSER_BRAND')
  await knex.schema.dropTableIfExists('DISPENSER')
  await knex.schema.dropTableIfExists('BATCH_RECIPE_STEP')
  await knex.schema.dropTableIfExists('BATCH_PLAN_PARAMETER')
  await knex.schema.dropTableIfExists('BATCH_PLAN')
  await knex.schema.dropTableIfExists('BATCH_HEADER')

  await knex.raw(`
    DROP FUNCTION IF EXISTS public.trg_adjust_dispenser_id_seq();
  `)

  await knex.raw(`
    DROP FUNCTION IF EXISTS public.trg_adjust_machine_id_seq();
  `)
}
