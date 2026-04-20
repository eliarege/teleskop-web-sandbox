import type { Knex } from 'knex'

export async function legacyMigration_3_4_18_0(knex: Knex) {
  if (!(await knex.schema.hasColumn('BACOMMANDINPUTOUTPUTS', 'PROGRAMEDITING'))) {
    await knex.raw(`ALTER TABLE BACOMMANDINPUTOUTPUTS ADD PROGRAMEDITING bit not null Default 0, COMMANDRUN bit not null Default 0`)
  }
}
