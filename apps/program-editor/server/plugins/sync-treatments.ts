import { db, dmExchange } from '../database'
import { upsertTreatments } from '../functions'
import logger from '../logger'

async function syncMissingTreatments(): Promise<void> {
  if (!dmExchange)
    return

  // Pick one machine per program using a window function (lowest MACHINEID wins)
  const allPrograms = await db
    .with('programs', (qb) => {
      qb.from('BFMASTERPRGHEADER AS H')
        .join('BFMACHINES AS M', 'M.MACHINEID', 'H.MACHINEID')
        .select({
          programNo: 'H.PROGNO',
          programName: 'H.NAME',
          groupNo: 'M.GRUPNO',
        })
        .rowNumber('rowNumber', 'H.MACHINEID', ['H.PROGNO'])
        .where('M.INUSE', true)
        .andWhere('M.USEINTELESKOP', true)
    })
    .select('programNo', 'programName', 'groupNo')
    .from('programs')
    .where('rowNumber', 1) as { programNo: number, programName: string, groupNo: number }[]

  if (!allPrograms.length)
    return

  const programNos = allPrograms.map(p => p.programNo)

  const existingTreatments = await dmExchange('Treatments')
    .whereIn('TreatmentNo', programNos)
    .andWhere('TreatmentType', 0)
    .select('TreatmentNo')

  const existingSet = new Set(existingTreatments.map((t: { TreatmentNo: number }) => t.TreatmentNo))
  const missingPrograms = allPrograms.filter(p => !existingSet.has(p.programNo))

  if (!missingPrograms.length) {
    logger.info('Treatment sync: no missing treatments found')
    return
  }

  logger.info(`Treatment sync: ${missingPrograms.length} programs missing from Treatments, syncing...`)

  try {
    await upsertTreatments(missingPrograms)
    logger.info(`Treatment sync: done — ${missingPrograms.length} synced`)
  } catch (err) {
    logger.error({ err }, 'Treatment sync: failed')
  }
}

export default defineNitroPlugin(() => {
  syncMissingTreatments().catch(err =>
    logger.error({ err }, 'Treatment sync: startup sync failed'),
  )
})
