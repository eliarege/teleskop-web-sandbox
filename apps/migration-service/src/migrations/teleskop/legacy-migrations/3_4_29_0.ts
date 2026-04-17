import type { Knex } from 'knex'

export async function legacyMigration_3_4_29_0(knex: Knex) {
  if (!(await knex.schema.hasColumn('TFMACHINESTATUS', 'LASTEVENTDATE'))) {
    await knex.raw(`
      Alter Table TFMACHINESTATUS Add
      LASTEVENTDATE date Null, LASTEVENTID int NULL
    `)
  }
}
