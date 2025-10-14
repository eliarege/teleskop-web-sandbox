import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Tables
  await knex.schema.createTable('BATCH_HEADER', (table) => {
    table.integer('plan_key')
    table.integer('recipe_index')
    table.integer('program_no')
    table.integer('recipe_type')
    table.double('flotte')
    table.double('flotte_ratio')
    table.double('total_weight')
  })

  await knex.schema.createTable('BATCH_PLAN', (table) => {
    table.increments('plan_key').primary()
    table.integer('batch')
    table.integer('batch_correction_no')
    table.integer('planned_machine')
    table.timestamp('planned_start_date', { useTz: true })
    table.integer('color_code')
    table.text('color_name')
    table.double('flotte')
    table.double('total_weight')
    table.text('notes')
    table.text('customer_name')
    table.text('fabric_type')
    table.integer('order_no')
    table.integer('work_order')
    table.integer('as_no')
    table.text('yarn')
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
    table.increments('machine_id').primary()
    table.text('machine_name')
    table.integer('controller_type')
  })

  await knex.schema.createTable('MACHINE_TANK', (table) => {
    table.integer('machine_id').notNullable()
    table.integer('tank_no').notNullable()
    table.string('tank_name').defaultTo('')
    table.float('tank_cap').defaultTo(0)
    table.integer('dispenser_id').defaultTo(-1)
    table.float('additional_cap').defaultTo(0)
    table.integer('tank_type').defaultTo(0)
    table.boolean('auto_water_system').defaultTo(false)
    table.boolean('external_water_system').defaultTo(false)
    table.integer('level_sensor_plc_no').defaultTo(0)
    table.integer('level_sensor_plc_id').defaultTo(0)
    table.integer('level_sensor_input_no').defaultTo(0)
    table.float('fill_water_before_percentage').defaultTo(0)
    table.integer('mixing_time').defaultTo(0)
    table.integer('des_tank_id').defaultTo(0)
    table.timestamps(true, true)
    table.foreign('machine_id').references('machine_id').inTable('MACHINE').onDelete('CASCADE')
    table.unique(['machine_id', 'tank_no'])
  })

  await knex.schema.createTable('MATERIAL', (table) => {
    table.text('material_code').notNullable().primary()
    table.text('material_name')
    table.double('ph')
    table.double('density')
    table.integer('material_group_no')
    table.boolean('re_requestable').defaultTo(false)
    table.boolean('direct_transfer').defaultTo(false)
    table.boolean('is_manual').defaultTo(false)
    table.text('cost_unit')
    table.double('unit_cost')
    table.text('source')
  })

  await knex.schema.createTable('COMPANY_INFO', (table) => {
    table.text('company_name')
    table.text('logo_path')
  })

  await knex('COMPANY_INFO').insert({
    company_name: '',
    logo_path: '',
  })

  await knex.schema.createTable('CUSTOMER', (table) => {
    table.integer('customer_id').primary()
    table.integer('customer_no')
    table.text('customer_name')
    table.text('customer_notes')
  })

  await knex.schema.createTable('DISPENSER', (table) => {
    table.increments('dispenser_id').primary()
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
    table.increments('brand_id').primary()
    table.text('brand_name')
  })

  await knex('DISPENSER_BRAND').insert({
    brand_id: 1,
    brand_name: 'eliar',
  })

  await knex.schema.createTable('DISPENSER_MACHINE_CONNECTION', (table) => {
    table.integer('dispenser_id')
    table.foreign('dispenser_id', 'fk_dispenser_id')
      .references('dispenser_id')
      .inTable('DISPENSER')
    table.integer('machine_id')
    table.foreign('machine_id', 'fk_machine_id')
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
    table.increments('dispenser_type_id').primary()
    table.text('dispenser_type_name')
    table.integer('dispenser_brand_id')
  })

  await knex.schema.createTable('DUST_MATERIAL', (table) => {
    table.integer('req_no')
    table.text('material_code')
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
    table.double('recipe_amount')
    table.double('real_amount')
    table.integer('main_step')
    table.integer('parallel_step')
  })

  await knex.schema.createTable('DUST_MATERIAL_REQUEST', (table) => {
    table.increments('req_no').primary()
    table.text('batch_no')
    table.integer('queue_no')
    table.integer('recipe_type')
    table.integer('dispenser_id')
    table.foreign('dispenser_id', 'fk_dispenser_id')
      .references('dispenser_id')
      .inTable('DISPENSER')
    table.timestamp('request_time', { precision: 6, useTz: true })
    table.integer('status')
    table.integer('correction_no')
    table.integer('recipe_index')
    table.integer('machine_id')
    table.foreign('machine_id', 'fk_machine_id')
      .references('machine_id')
      .inTable('MACHINE')
  })

  await knex.schema.createTable('DATABASE_SETTINGS', (table) => {
    table.text('user')
    table.text('password')
    table.text('database')
    table.text('host')
    table.integer('port')
    table.text('client')
    table.text('host_computer')
    table.text('db_type')
  })

  await knex('DATABASE_SETTINGS').insert([
    {
      user: 'admin',
      password: 'Teleskop',
      database: 'Teleskop',
      host: 'localhost',
      port: 1433,
      client: 'mssql',
      host_computer: 'server',
      db_type: 'teleskop',
    },
    {
      user: 'readonly',
      password: '123456',
      database: 'DmExchange',
      host: '192.168.1.10',
      port: 1433,
      client: 'mssql',
      host_computer: 'server',
      db_type: 'dmexchange',
    },
  ])

  await knex.schema.createTable('FABRIC_TYPE', (table) => {
    table.integer('fabric_type_id').primary()
    table.text('fabric_type_name')
    table.text('fabric_type_notes')
  })
  //
  await knex.schema.createTable('JOB_ORDER', (table) => {
    table.increments('job_id').primary()
    table.integer('batch_correction_no')
    table.integer('tank_no')
    table.integer('program_no')
    table.integer('recipe_process_no')
    table.integer('recipe_step_no')
    table.integer('step_no')
    table.integer('dispenser_id')
    table.foreign('dispenser_id', 'fk_dispenser_id')
      .references('dispenser_id')
      .inTable('DISPENSER')
    table.integer('machine_id')
    table.foreign('machine_id', 'fk_machine_id')
      .references('machine_id')
      .inTable('MACHINE')
    table.smallint('status')
    table.smallint('recipe_type')
    table.integer('batch_no')
    table.integer('type')
    table.timestamp('request_time', { precision: 6, useTz: true })
    table.timestamp('completed_time', { precision: 6, useTz: true })
    table.integer('priority').defaultTo(50)
  })

  await knex.schema.createTable('MACHINE_CONTROLLER_TYPE', (table) => {
    table.integer('controller_type_id')
    table.text('controller_type_name')
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
    table.foreign('dispenser_id', 'fk_dispenser_id')
      .references('dispenser_id')
      .inTable('DISPENSER')
  })

  await knex.schema.createTable('PROGRAM_HEADER', (table) => {
    table.integer('machine_id')
    table.integer('program_no')
    table.primary(['machine_id', 'program_no'])
    table.text('program_name')
    table.integer('program_type')
    table.integer('chem_requests')
    table.integer('dye_requests')
    table.integer('salt_requests')
  })

  await knex.schema.createTable('PROGRAM_TEMPLATE', (table) => {
    table.integer('program_no')
    table.integer('type')
  })

  await knex.schema.createTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.text('material_code')
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
    table.integer('program_no')
    table.integer('step_no')
    table.integer('type')
    table.integer('unit')
    table.double('amount')
  })

  await knex.schema.createTable('PROGRAM_TYPE', (table) => {
    table.increments('id').primary()
    table.text('name')
  })

  await knex.schema.createTable('PROTOCOL', (table) => {
    table.integer('dispenser_brand_id')
    table.foreign('dispenser_brand_id', 'fk_dispenser_brand_id')
      .references('brand_id')
      .inTable('DISPENSER_BRAND')
    table.text('protocol')
    table.specificType('fields', 'text[]')
  })

  await knex.schema.createTable('RECIPE_MASTER', (table) => {
    table.increments('recipe_id').primary()
    table.text('recipe_name')
    table.integer('machine_id')
    table.foreign('machine_id', 'fk_machine_id')
      .references('machine_id')
      .inTable('MACHINE')
    table.integer('recipe_group')
    table.text('recipe_comment')
    table.integer('recipe_type')
    table.integer('color_code')
    table.text('color_name')
    table.timestamp('prep_time', { precision: 6, useTz: true })
    table.timestamp('last_update', { precision: 6, useTz: true })
    table.boolean('is_passive')
  })

  await knex.schema.createTable('RECIPE_MASTER_STEP', (table) => {
    table.integer('recipe_id')
    table.foreign('recipe_id', 'fk_recipe_id')
      .references('recipe_id')
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
    table.integer('program_no')
    table.integer('step_no')
    table.integer('type')
  })

  await knex.schema.createTable('RECIPE_MASTER_MATERIAL', (table) => {
    table.integer('recipe_id')
    table.foreign('recipe_id', 'fk_recipe_id')
      .references('recipe_id')
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
    table.text('material_code').notNullable()
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
    table.integer('program_no')
    table.integer('step_no')
    table.integer('unit')
    table.double('amount')
    table.integer('type')
    table.integer('program_index')
  })

  await knex.schema.createTable('RECIPE_VARIANT', (table) => {
    table.increments('recipe_id')
    table.foreign('recipe_id', 'fk_recipe_id')
      .references('recipe_id')
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
    table.text('variant_name')
    table.integer('color_code')
    table.text('color_name')
    table.timestamp('prep_time', { precision: 6, useTz: true })
    table.timestamp('last_update', { precision: 6, useTz: true })
    table.primary(['recipe_id', 'variant_name'])
  })

  await knex.schema.createTable('RECIPE_VARIANT_STEP', (table) => {
    table.integer('recipe_id')
    table.foreign('recipe_id', 'fk_recipe_id')
      .references('recipe_id')
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
    table.text('variant_name')
    table.integer('program_no')
    table.integer('step_no')
    table.integer('type')
  })

  await knex.schema.createTable('RECIPE_VARIANT_MATERIAL', (table) => {
    table.integer('recipe_id')
    table.foreign('recipe_id', 'fk_recipe_id')
      .references('recipe_id')
      .inTable('RECIPE_MASTER')
      .onDelete('CASCADE')
    table.text('material_code').notNullable()
    table.foreign('material_code', 'fk_material_code')
      .references('material_code')
      .inTable('MATERIAL')
    table.integer('program_no')
    table.integer('step_no')
    table.integer('unit')
    table.double('amount')
    table.integer('type')
    table.integer('program_index')
    table.text('variant_name')
  })

  await knex.schema.createTable('RECIPE_CONTINUE', (table) => {
    table.increments('recipe_id').primary()
    table.text('recipe_name')
  })

  await knex.schema.createTable('RECIPE_CONTINUE_STEP', (table) => {
    table.integer('recipe_id')
    table.foreign('recipe_id', 'fk_recipe_id').references('recipe_id').inTable('RECIPE_MASTER')
    table.text('material_code').notNullable()
    table.foreign('material_code', 'fk_material_code').references('material_code').inTable('MATERIAL')
    table.integer('step_no')
    table.integer('unit')
    table.integer('amount')
    table.integer('type')
  })

  await knex.schema.createTable('RECIPE_PROGRAM_MASTER', (table) => {
    table.increments('recipe_id').primary()
    table.text('recipe_name')
    table.integer('recipe_group')
    table.text('recipe_comment')
    table.integer('recipe_type')
    table.timestamp('prep_time', { precision: 6, useTz: true })
    table.timestamp('last_update', { precision: 6, useTz: true })
    table.integer('step_no')
    table.integer('program_no')
    table.integer('machine_id')
    table.foreign('machine_id', 'fk_machine_id')
      .references('machine_id')
      .inTable('MACHINE')
    table.boolean('is_passive')
  })

  await knex.schema.createTable('RECIPE_PROGRAM_MASTER_STEP', (table) => {
    table.integer('recipe_master_program_id')
    table.foreign('recipe_master_program_id', 'fk_recipe_master_program_id').references('recipe_id').inTable('RECIPE_PROGRAM_MASTER')
    table.text('material_code').notNullable()
    table.foreign('material_code', 'fk_material_code').references('material_code').inTable('MATERIAL')
    table.integer('main_step')
    table.integer('parallel_step')
    table.integer('unit').defaultTo(3)
    table.double('amount')
    table.primary(['recipe_master_program_id', 'main_step', 'parallel_step'])
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
    table.dropForeign(['dispenser_id'], 'fk_dispenser_id')
    table.dropForeign(['machine_id'], 'fk_machine_id')
  })

  await knex.schema.alterTable('DISPENSER_MATERIAL_CONNECTION', (table) => {
    table.dropForeign(['dispenser_id'], 'dispenser')
    table.dropForeign(['material_code'], 'material')
  })

  await knex.schema.alterTable('DUST_MATERIAL', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })

  await knex.schema.alterTable('DUST_MATERIAL_REQUEST', (table) => {
    table.dropForeign(['dispenser_id'], 'fk_dispenser_id')
    table.dropForeign(['machine_id'], 'fk_machine_id')
  })

  await knex.schema.alterTable('JOB_ORDER', (table) => {
    table.dropForeign(['dispenser_id'], 'fk_dispenser_id')
    table.dropForeign(['machine_id'], 'fk_machine_id')
  })

  await knex.schema.alterTable('MATERIAL_REQUEST', (table) => {
    table.dropForeign(['dispenser_id'], 'fk_dispenser_id')
  })

  await knex.schema.alterTable('PROTOCOL', (table) => {
    table.dropForeign(['dispenser_brand_id'], 'fk_dispenser_brand_id')
  })

  await knex.schema.alterTable('PROGRAM_TEMPLATE_STEP', (table) => {
    table.dropForeign(['material_code'], 'fk_material_code')
  })

  await knex.schema.alterTable('RECIPE_CONTINUE', (table) => {
    table.dropForeign(['recipe_id'], 'fk_recipe_id')
    table.dropForeign(['material_code'], 'fk_material_code')
  })

  await knex.schema.alterTable('RECIPE_MASTER_MATERIAL', (table) => {
    table.dropForeign(['recipe_id'], 'fk_recipe_id')
    table.dropForeign(['material_code'], 'fk_material_code')
  })

  await knex.schema.alterTable('RECIPE_PROGRAM_MASTER', (table) => {
    table.dropForeign(['machine_id'], 'fk_machine_id')
  })

  await knex.schema.alterTable('RECIPE_PROGRAM_MASTER_STEP', (table) => {
    table.dropForeign(['recipe_master_program_id'], 'fk_recipe_master_program_id')
    table.dropForeign(['material_code'], 'fk_material_code')
  })

  await knex.schema.dropTableIfExists('RECIPE_CONTINUE')
  await knex.schema.dropTableIfExists('RECIPE_CONTINUE_STEP')
  await knex.schema.dropTableIfExists('RECIPE_MASTER')
  await knex.schema.dropTableIfExists('RECIPE_MASTER_STEP')
  await knex.schema.dropTableIfExists('RECIPE_MASTER_MATERIAL')
  await knex.schema.dropTableIfExists('RECIPE_PROGRAM_MASTER')
  await knex.schema.dropTableIfExists('RECIPE_PROGRAM_MASTER_STEP')
  await knex.schema.dropTableIfExists('RECIPE_VARIANT')
  await knex.schema.dropTableIfExists('RECIPE_VARIANT_STEP')
  await knex.schema.dropTableIfExists('RECIPE_VARIANT_MATERIAL')
  await knex.schema.dropTableIfExists('PROTOCOL')
  await knex.schema.dropTableIfExists('PROGRAM_TEMPLATE_STEP')
  await knex.schema.dropTableIfExists('PROGRAM_TEMPLATE')
  await knex.schema.dropTableIfExists('PROGRAM_HEADER')
  await knex.schema.dropTableIfExists('MATERIAL_REQUEST')
  await knex.schema.dropTableIfExists('MATERIAL')
  await knex.schema.dropTableIfExists('MACHINE_CONTROLLER_TYPE')
  await knex.schema.dropTableIfExists('MACHINE')
  await knex.schema.dropTableIfExists('JOB_ORDER')
  await knex.schema.dropTableIfExists('FABRIC_TYPE')
  await knex.schema.dropTableIfExists('DATABASE_SETTINGS')
  await knex.schema.dropTableIfExists('DUST_MATERIAL_REQUEST')
  await knex.schema.dropTableIfExists('DUST_MATERIAL')
  await knex.schema.dropTableIfExists('DISPENSER_TYPE')
  await knex.schema.dropTableIfExists('DISPENSER_MATERIAL_CONNECTION')
  await knex.schema.dropTableIfExists('DISPENSER_MACHINE_CONNECTION')
  await knex.schema.dropTableIfExists('DISPENSER_BRAND')
  await knex.schema.dropTableIfExists('DISPENSER')
  await knex.schema.dropTableIfExists('CUSTOMER')
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
