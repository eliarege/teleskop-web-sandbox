import type { Knex } from 'knex'

export async function legacyMigration_3_4_17_0(knex: Knex) {
  if (!(await knex.schema.hasColumn('BAMASTERCOMMANDS', 'ISDELETED'))) {
    await knex.raw(`ALTER TABLE BAMASTERCOMMANDS ADD ISDELETED bit not null Default 0`)
  }
}
