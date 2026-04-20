import type { Knex } from 'knex'

export async function legacyMigration_3_4_13_0(knex: Knex) {
  const rows = await knex('BFUSERS')
    .select<{ userID: number, userMode2: string }[]>('userID', 'userMode2')
    .orderBy('userID', 'asc')

  for (const row of rows) {
    let tstr = row.userMode2 ?? ''

    if (tstr.trim() === '') {
      tstr = `0x00000013`
    }
    if (tstr.length === 10) {
      tstr = `${tstr.substring(0, 8)}1${tstr.substring(9)}`
    }
    await knex.raw(
      `UPDATE BFUSERS SET userMode2 = :userMode2 WHERE userID = :userID`,
      { userMode2: tstr, userID: row.userID },
    )
  }
}
