import type { Knex } from 'knex'

export async function legacyMigration_3_4_25_0(knex: Knex) {
  if (!(await knex.schema.hasColumn('BFCOMMANDPARAMETERS', 'PARAMETERGROUP'))) {
    await knex.raw('ALTER TABLE BFCOMMANDPARAMETERS ADD PARAMETERGROUP int')
  }

  if (!(await knex.schema.hasColumn('BFCOMMANDPARAMETERS', 'VALUEINDEX'))) {
    await knex.raw('ALTER TABLE BFCOMMANDPARAMETERS ADD VALUEINDEX int')
  }

  if (!(await knex.schema.hasColumn('BACOMMANDPARAMETERS', 'PARAMETERGROUP'))) {
    await knex.raw('ALTER TABLE BACOMMANDPARAMETERS ADD PARAMETERGROUP int')
  }

  if (!(await knex.schema.hasColumn('BACOMMANDPARAMETERS', 'VALUEINDEX'))) {
    await knex.raw('ALTER TABLE BACOMMANDPARAMETERS ADD VALUEINDEX int')
  }

  if (!(await knex.schema.hasColumn('BFMASTERPRGHEADER', 'ADDITIONALPROCESSCODE'))) {
    await knex.raw('ALTER TABLE BFMASTERPRGHEADER ADD ADDITIONALPROCESSCODE int')
  }

  if (!(await knex.schema.hasColumn('BAMASTERPRGHEADER', 'ADDITIONALPROCESSCODE'))) {
    await knex.raw('ALTER TABLE BAMASTERPRGHEADER ADD ADDITIONALPROCESSCODE int')
  }

  if (!(await knex.schema.hasColumn('BFMASTERCOMMANDSALARMS', 'SHOWONSCREEN'))) {
    await knex.raw('ALTER TABLE BFMASTERCOMMANDSALARMS ADD SHOWONSCREEN bit not null default 1')
    await knex.raw('UPDATE BFMASTERCOMMANDSALARMS SET SHOWONSCREEN = 1')
  }

  if (!(await knex.schema.hasColumn('BAMASTERCOMMANDSALARMS', 'SHOWONSCREEN'))) {
    await knex.raw('ALTER TABLE BAMASTERCOMMANDSALARMS ADD SHOWONSCREEN bit not null default 1')
    await knex.raw('UPDATE BAMASTERCOMMANDSALARMS SET SHOWONSCREEN = 1')
  }
}
