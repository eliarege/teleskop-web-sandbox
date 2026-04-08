import type { Knex } from 'knex'

const PROCESS_TYPES = [
  { PROCESSCODE: 0, PROCESSNAME: 'Standart Boyama', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 1, PROCESSNAME: 'Sentetik/Özel Boyama', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 2, PROCESSNAME: 'Kasar(Ön İşlem)', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 3, PROCESSNAME: 'Hazırlık/Yağ Sökümü', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 4, PROCESSNAME: 'Yıkama(Haslık)', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 5, PROCESSNAME: 'Yumuşatma', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 6, PROCESSNAME: 'Durulama/Söküm', NOTE: '', BOYAPRGMI: 1 },
  { PROCESSCODE: 7, PROCESSNAME: 'İlave Program', NOTE: '', BOYAPRGMI: 1 },
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

  const toUpdate = PROCESS_TYPES.filter(p => existingSet.has(p.PROCESSCODE))
  for (const p of toUpdate) {
    await knex('BFPROCESSTYPES')
      .where('PROCESSCODE', p.PROCESSCODE)
      .update({ PROCESSNAME: p.PROCESSNAME })
  }
}
