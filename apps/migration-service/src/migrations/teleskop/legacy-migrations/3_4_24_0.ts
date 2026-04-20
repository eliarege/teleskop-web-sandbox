import type { Knex } from 'knex'

export async function legacyMigration_3_4_24_0(knex: Knex) {
  if (!(await knex.schema.hasColumn('BFCOMMANDPARAMETERS', 'MACHINECONSTANTFORLOWLIMIT'))) {
    await knex.raw(`
      ALTER TABLE BFCOMMANDPARAMETERS
      ADD
        MACHINECONSTANTFORLOWLIMIT int not null default -1,
        MACHINECONSTANTFORHIGHLIMIT int not null default -1`,
    )
    await knex.raw(`
      UPDATE BFCOMMANDPARAMETERS
      SET
        MACHINECONSTANTFORLOWLIMIT = -1,
        MACHINECONSTANTFORHIGHLIMIT = -1`,
    )
  }

  if (!(await knex.schema.hasColumn('BFMACHBATCHPARAMETERS', 'MACHINECONSTANTFORLOWLIMIT'))) {
    await knex.raw(`
      ALTER TABLE BFMACHBATCHPARAMETERS
      ADD
        MACHINECONSTANTFORLOWLIMIT int not null default -1,
        MACHINECONSTANTFORHIGHLIMIT int not null default -1,
        VISIBILITY bit not null default 1
    `)
    await knex.raw(`
      UPDATE BFMACHBATCHPARAMETERS
      SET
        MACHINECONSTANTFORLOWLIMIT = -1,
        MACHINECONSTANTFORHIGHLIMIT = -1,
        VISIBILITY = 1
    `)
  }
}
