import type { Knex } from 'knex'

export async function legacyMigration_3_4_31_0(knex: Knex) {
  await knex.raw(`
    UPDATE t
    SET t.RELEASEENDDATE = t2.RELEASEDATE
    FROM BAMASTERCOMMANDS t
    INNER JOIN BAMASTERCOMMANDS t2 ON t.MACHINEID = t2.MACHINEID and t.COMMANDNO = t2.COMMANDNO
    WHERE t2.MACHINECOMMANDSETNO = t.MACHINECOMMANDSETNO + 1 AND t.RELEASEENDDATE is null
  `)
}
