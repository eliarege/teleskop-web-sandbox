import type { Knex } from 'knex'

export async function legacyMigration_3_4_14_0(knex: Knex) {
  if (!(await knex.schema.hasColumn('BFMACHAIN', 'CALIBLOWERLIMIT'))) {
    await knex.raw(`ALTER TABLE BFMACHAIN ADD CALIBLOWERLIMIT nvarchar(500), CALIBUPPERLIMIT nvarchar(500)`)
  }
}
