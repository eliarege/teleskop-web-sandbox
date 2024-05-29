import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  //Tables
  await knex.schema.createTable('BATCH_HEADER', (table) => {
    table.integer('plan_key')
    table.integer('recipe_index')
    table.integer('recipe_no')
    table.integer('recipe_type')
  })

  await knex.schema.createTable('BATCH_PLAN', (table) => {
    table.integer('plan_key').notNullable()
    table.text('batch')
    table.integer('batch_correction_no')
    table.integer('planned_machine')
    table.timestamp('planned_start_date', { useTz: true })
    table.primary(['plan_key'])
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
    table.text('chem_code')
    table.integer('prog_proc_no')
    table.double('amount')
    table.integer('unit').defaultTo(3)
    table.text('batch_order')
  })

  await knex.schema.createTable('DISPENSER', (table) => {
    table.integer('dispenser_id').notNullable().primary().defaultTo(knex.raw('nextval(\'"DISPENSER_dispenser_id_seq"\'::regclass)'))
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
    table.integer('brand_id').notNullable().primary().defaultTo(knex.raw('nextval(\'"DISPENSER_BRAND_brand_id_seq"\'::regclass)'))
    table.text('brand_name')
  })

  await knex.schema.createTable('DISPENSER_MACHINE_CONNECTION', (table) => {
    table.integer('dispenser_id')
    table.integer('machine_id')
  })

  await knex.schema.createTable('DISPENSER_MATERIAL_CONNECTION', (table) => {
    table.integer('dispenser_id')
    table.text('material_code')
  })

  await knex.schema.createTable('DISPENSER_TYPE', (table) => {
    table.integer('dispenser_type_id').notNullable().primary()
    table.text('dispenser_type_name')
    table.integer('dispenser_brand_id')
  })

  await knex.schema.createTable('DUST_MATERIAL', (table) => {
    table.integer('req_no')
    table.text('material_code')
    table.double('recipe_amount')
    table.double('real_amount')
    table.integer('main_step')
    table.integer('parallel_step')
  })

  await knex.schema.createTable('DUST_MATERIAL_REQUEST', (table) => {
    table.integer('req_no').notNullable().primary()
    table.text('batch_no')
    table.integer('queue_no')
    table.integer('recipe_type')
    table.integer('dispenser_id')
    table.timestamp('request_time', { precision: 6, useTz: true })
    table.integer('status')
    table.integer('correction_no')
    table.integer('recipe_index')
    table.integer('machine_id')
  })

  await knex.schema.createTable('JOB_ORDER', (table) => {
    table.integer('batch_correction_no')
    table.integer('tank_no')
    table.integer('program_no')
    table.integer('recipe_process_no')
    table.integer('recipe_step_no')
    table.integer('job_id').notNullable().primary().defaultTo(knex.raw('nextval(\'"JOB_ORDER_job_id_seq"\'::regclass)'))
    table.integer('step_no')
    table.integer('dispenser_id')
    table.integer('machine_id').notNullable().defaultTo(knex.raw('nextval(\'"JOB_ORDER_machine_id_seq"\'::regclass)'))
    table.smallint('status')
    table.smallint('recipe_type')
    table.integer('batch_no')
    table.timestamp('request_time', { precision: 6, useTz: true })
    table.timestamp('completed_time', { precision: 6, useTz: true })
    table.integer('priority').defaultTo(50)
  })

  await knex.schema.createTable('MACHINE', (table) => {
    table.integer('machine_id').notNullable().primary().defaultTo(knex.raw('nextval(\'"machine_id_seq"\'::regclass)'))
    table.text('machine_name')
    table.integer('controller_type')
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
  })

  await knex.schema.createTable('PROGRAM_HEADER', (table) => {
    table.integer('machine_id')
    table.integer('program_no')
    table.text('program_name')
  })

  await knex.schema.createTable('PROTOCOL', (table) => {
    table.integer('dispenser_brand_id')
    table.text('protocol')
    table.specificType('fields', 'text[]')
  })

  await knex.schema.createTable('RECIPE_MASTER', (table) => {
    table.integer('recipe_id').notNullable().primary()
    table.text('recipe_name')
    table.integer('recipe_group')
    table.text('recipe_comment')
    table.integer('recipe_type')
    table.timestamp('prep_time', { precision: 6, useTz: true })
    table.timestamp('last_update', { precision: 6, useTz: true })
    table.integer('step_no')
    table.integer('program_no')
    table.integer('machine_id')
    table.boolean('is_passive')
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

  await knex.schema.createTable('knex_migrations', (table) => {
    table.integer('id').notNullable().primary().defaultTo(knex.raw('nextval(\'"knex_migrations_id_seq"\'::regclass)'))
    table.string('name', 255)
    table.integer('batch')
    table.timestamp('migration_time', { useTz: true })
  })

  await knex.schema.createTable('knex_migrations_lock', (table) => {
    table.integer('index').notNullable().primary().defaultTo(knex.raw('nextval(\'"knex_migrations_lock_index_seq"\'::regclass)'))
    table.integer('is_locked')
  })
  //Sequences
  await knex.raw(`
    CREATE SEQUENCE IF NOT EXISTS "DISPENSER_dispenser_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER TABLE "DISPENSER" ALTER COLUMN dispenser_id ADD GENERATED BY DEFAULT AS IDENTITY (SEQUENCE NAME "DISPENSER_dispenser_id_seq");

    CREATE SEQUENCE IF NOT EXISTS "DISPENSER_BRAND_brand_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER TABLE "DISPENSER_BRAND" ALTER COLUMN brand_id ADD GENERATED BY DEFAULT AS IDENTITY (SEQUENCE NAME "DISPENSER_BRAND_brand_id_seq");

    CREATE SEQUENCE IF NOT EXISTS "JOB_ORDER_job_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER TABLE "JOB_ORDER" ALTER COLUMN job_id ADD GENERATED BY DEFAULT AS IDENTITY (SEQUENCE NAME "JOB_ORDER_job_id_seq");

    CREATE SEQUENCE IF NOT EXISTS "JOB_ORDER_machine_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER TABLE "JOB_ORDER" ALTER COLUMN machine_id ADD GENERATED BY DEFAULT AS IDENTITY (SEQUENCE NAME "JOB_ORDER_machine_id_seq");

    CREATE SEQUENCE IF NOT EXISTS "machine_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER TABLE "MACHINE" ALTER COLUMN machine_id ADD GENERATED BY DEFAULT AS IDENTITY (SEQUENCE NAME "machine_id_seq");

    CREATE SEQUENCE IF NOT EXISTS "knex_migrations_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER TABLE "knex_migrations" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (SEQUENCE NAME "knex_migrations_id_seq");

    CREATE SEQUENCE IF NOT EXISTS "knex_migrations_lock_index_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER TABLE "knex_migrations_lock" ALTER COLUMN index ADD GENERATED BY DEFAULT AS IDENTITY (SEQUENCE NAME "knex_migrations_lock_index_seq");
  `)
  //Functions
  await knex.raw(`
    CREATE FUNCTION public.before_insert_machine_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      -- Check if the combination of dispenser_id and machine_id already exists
      IF EXISTS (
        SELECT 1
        FROM "DISPENSER_MACHINE_CONNECTION"
        WHERE dispenser_id = NEW.dispenser_id
        AND machine_id = NEW.machine_id
      ) THEN
        -- If it exists, do nothing (ignore the insertion)
        RETURN NULL;
      END IF;

      -- Otherwise, allow the insertion to proceed
      RETURN NEW;
    END;
    $$;
  `)

  await knex.raw(`
    CREATE FUNCTION public.before_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      -- Check if the combination of dispenser_id and material_code already exists
      IF EXISTS (
        SELECT 1
        FROM "DISPENSER_MATERIAL_CONNECTION"
        WHERE dispenser_id = NEW.dispenser_id
        AND material_code = NEW.material_code
      ) THEN
        -- If it exists, do nothing (ignore the insertion)
        RETURN NULL;
      END IF;

      -- Otherwise, allow the insertion to proceed
      RETURN NEW;
    END;
    $$;
  `)

  await knex.raw(`
    CREATE FUNCTION public.trg_adjust_dispenser_id_seq() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        PERFORM nextval('dispenser_id_seq');

        IF NEW.dispenser_id >= currval('dispenser_id_seq') THEN
            PERFORM setval('dispenser_id_seq', NEW.dispenser_id + 1);
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
        -- Ensure that the sequence has been advanced at least once in this session
        PERFORM nextval('machine_id_seq');

        -- Check if the new machine_id is greater than or equal to the current sequence value
        IF NEW.machine_id >= currval('machine_id_seq') THEN
            -- Adjust the sequence value to be greater than the new machine_id
            PERFORM setval('machine_id_seq', NEW.machine_id + 1);
        END IF;

        -- Return the new row for insertion
        RETURN NEW;
    END;
    $$;
  `)

  await knex.raw(`
    CREATE FUNCTION public.update_machine_id_seq() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        IF NEW.machine_id >= currval('machine_id_seq') THEN
            PERFORM setval('machine_id_seq', NEW.machine_id + 1);
        END IF;
        RETURN NEW;
    END;
    $$;
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('knex_migrations_lock')
  await knex.schema.dropTableIfExists('knex_migrations')
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
  DROP FUNCTION IF EXISTS public.before_insert_machine_trigger();
`)

await knex.raw(`
  DROP FUNCTION IF EXISTS public.before_insert_trigger();
`)

await knex.raw(`
  DROP FUNCTION IF EXISTS public.trg_adjust_dispenser_id_seq();
`)

await knex.raw(`
  DROP FUNCTION IF EXISTS public.trg_adjust_machine_id_seq();
`)

await knex.raw(`
  DROP FUNCTION IF EXISTS public.update_machine_id_seq();
`)
}
