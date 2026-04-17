import type { Knex } from 'knex'

export async function legacyMigration_3_4_11_0(knex: Knex) {
  await knex.raw(`Alter table TFTELESKOPSETTINGS alter column VALUE nvarchar(4000) not null`)

  // This is already handled by 004_init-data.ts migration.
  // Keeping this here just for reference.

  // await knex.raw(`
  //   Insert Into TFTELESKOPSETTINGS(ID,VALUE)
  //   Values(:id, :value)
  // `, { id: TeleskopSettings.EditorSelectedCommandIcons, value: `` })

  // await knex.raw(`
  //   Insert Into TFTELESKOPSETTINGS(ID,VALUE)
  //   Values(:id, :value)
  // `, { id: TeleskopSettings.InitialWaterTemperature, value: `` })

  // await knex.raw(`
  //   Insert Into TFTELESKOPSETTINGS(ID,VALUE)
  //   Values(:id, :value)
  // `, { id: TeleskopSettings.IntegrationDatabaseActive, value: `` })

  // await knex.raw(`
  //   Insert Into TFTELESKOPSETTINGS(ID,VALUE)
  //   Values(:id, :value)
  // `, { id: TeleskopSettings.IntegrationDatabaseConnectionString, value: `` })
}
