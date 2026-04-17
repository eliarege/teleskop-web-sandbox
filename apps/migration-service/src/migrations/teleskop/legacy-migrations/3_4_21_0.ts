import type { Knex } from 'knex'

export async function legacyMigration_3_4_21_0(knex: Knex) {
  if (!(await knex.schema.hasColumn('BAACTUALPRGSTEPS', 'OPTIMIZEDTHEORETICDURATION'))) {
    await knex.raw(`ALTER TABLE BAACTUALPRGSTEPS ADD OPTIMIZEDTHEORETICDURATION int null`)
  }
}
