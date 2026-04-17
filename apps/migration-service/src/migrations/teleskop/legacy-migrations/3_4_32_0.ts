import type { Knex } from 'knex'

export async function legacyMigration_3_4_32_0(knex: Knex) {
  await knex.raw(`
    ALTER TABLE BACOMMANDPARAMETERS ALTER COLUMN PARAMSTRING nvarchar(100)
  `)
}
