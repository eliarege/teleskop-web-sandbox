import type { Knex } from 'knex'

const TABLE = 'TFMACHINESTATUS'
const COLUMNS = ['lastPingFail', 'lastSoapFail'] as const
const NEW_DEFAULT = '1900-01-01'

async function findDefaultConstraintName(knex: Knex, column: string): Promise<string | null> {
  const result = await knex.raw<{ name: string }[]>(
    `SELECT dc.name
     FROM sys.default_constraints dc
     JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
     WHERE OBJECT_NAME(dc.parent_object_id) = ? AND c.name = ?`,
    [TABLE, column],
  )
  return (result as unknown as { name: string }[])[0]?.name ?? null
}

// Eski default değer (0), SQL 2025'de geçerli bir tarih olmadığı için sorun yaratıyordu.
// Bu migration ile default değeri 1900-01-01 yapıyoruz.
export async function up(knex: Knex) {
  for (const column of COLUMNS) {
    const constraintName = await findDefaultConstraintName(knex, column)
    if (constraintName) {
      await knex.raw(`ALTER TABLE ?? DROP CONSTRAINT ??`, [TABLE, constraintName])
    }
    await knex.raw(`ALTER TABLE ?? ADD DEFAULT ? FOR ??`, [TABLE, NEW_DEFAULT, column])
  }
}

export async function down(knex: Knex) {
  // Down migration not implemented
}
