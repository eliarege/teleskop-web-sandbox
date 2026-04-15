import { db, dmExchange } from '../database'
import { ensureTreatmentGroups, fetchTeleskopSettings } from '../functions'
import { machineStore } from '../classes/MachineStore'
import logger from '../logger'

async function syncMissingTreatments(): Promise<void> {
  const config = useRuntimeConfig()
  if (!config.dmexchangeEnabled)
    return

  const settings = await fetchTeleskopSettings()
  if (!settings.treatmentSettings.optimizedEnable)
    return

  const allPrograms = await db('BFMASTERPRGHEADER')
    .distinct({ machineId: 'MACHINEID', programNo: 'PROGNO' })

  if (!allPrograms.length)
    return

  const programNos = [...new Set(allPrograms.map((p: { programNo: number }) => p.programNo))]

  const existingTreatments = await dmExchange('Treatments')
    .whereIn('TreatmentNo', programNos)
    .andWhere('TreatmentType', 0)
    .select('TreatmentNo')

  const existingSet = new Set(existingTreatments.map((t: { TreatmentNo: number }) => t.TreatmentNo))
  const missingProgramNos = programNos.filter(no => !existingSet.has(no))

  if (!missingProgramNos.length) {
    logger.info('Treatment sync: no missing treatments found')
    return
  }

  logger.info(`Treatment sync: ${missingProgramNos.length} programs missing from Treatments, syncing...`)

  await ensureTreatmentGroups()

  let successCount = 0
  let errorCount = 0

  for (const programNo of missingProgramNos) {
    const row = allPrograms.find((p: { programNo: number }) => p.programNo === programNo)!
    try {
      const controller = await machineStore.get(row.machineId)
      const { program } = await controller.fetchProgram(programNo)
      await controller.upsertTreatments(program)
      successCount++
    } catch (err) {
      errorCount++
      logger.error({ err, machineId: row.machineId, programNo }, `Treatment sync: failed for machine ${row.machineId}, program ${programNo}`)
    }
  }

  logger.info(`Treatment sync: done — ${successCount} synced, ${errorCount} failed`)
}

export default defineNitroPlugin(() => {
  syncMissingTreatments().catch(err =>
    logger.error({ err }, 'Treatment sync: startup sync failed'),
  )
})
