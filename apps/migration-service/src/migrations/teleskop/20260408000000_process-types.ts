import type { Knex } from 'knex'

const PROCESS_TYPES = [
  { PROCESSCODE: 0, PROCESSNAME: '#dye', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 1, PROCESSNAME: '#synthetic', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 2, PROCESSNAME: '#bleaching', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 3, PROCESSNAME: '#preparation', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 4, PROCESSNAME: '#washing', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 5, PROCESSNAME: '#softening', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 6, PROCESSNAME: '#rinsing', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 7, PROCESSNAME: '#additional', NOTE: '', BOYAPRGMI: 1 },
]

export async function up(knex: Knex) {
  const existingCodes = await knex('BFPROCESSTYPES')
    .select('PROCESSCODE')
    .whereIn('PROCESSCODE', PROCESS_TYPES.map(p => p.PROCESSCODE))

  const existingSet = new Set(existingCodes.map(p => p.PROCESSCODE))

  const toInsert = PROCESS_TYPES.filter(p => !existingSet.has(p.PROCESSCODE))
  if (toInsert.length > 0) {
    await knex('BFPROCESSTYPES').insert(toInsert)
  }
}

export function down(_knex: Knex) {
  // Skip down migration
}
