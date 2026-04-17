import type { Knex } from 'knex'

export async function legacyMigration_3_4_07_0(_knex: Knex) {
  // This is already handled by 004_init-data.ts migration.
  // Keeping this here just for reference. No actual schema changes are needed for this version.

  // await knex.raw(`
  //   Insert Into TFTELESKOPSETTINGS(ID,VALUE)
  //   Values(:id, :value)
  // `, { id: TeleskopSettings.SaveIOValuesInDatabase, value: `0` })
}
