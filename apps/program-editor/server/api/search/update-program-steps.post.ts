import { machineStore } from '~/server/classes/MachineStore'
import { PError, isPError } from '~/server/error'
import logger from '~/server/logger'
import type { ReplaceInProgramsParams } from '~/shared/types'

/**
 * Endpoint: Update Program Steps (Bul ve Değiştir -> Değiştir İşlemi)
 * Bu endpoint, "Bul ve Değiştir" arayüzünden gelen talepleri işler.
 * Programın tamamını değiştirmek yerine, SADECE hedeflenen belirli adımların (steps)
 * içindeki komut, parametre veya IO değerlerini noktasal olarak günceller.
 * İşleyiş:
 * 1. Gelen "hedef" listesini (hangi makine, hangi program, hangi adım) veritabanı yorgunluğunu önlemek için makine bazında gruplar.
 * 2. Belirtilen hedeflerdeki eski değerleri, kullanıcının girdiği yeni değerlerle (replaceValues) değiştirir.
 * 3. Toplu işlem (bulk update) yapar ve güncellenen toplam kayıt sayısını döner.
 */

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as ReplaceInProgramsParams

    if (!body.targets?.length) {
      throw new PError('NO_TARGETS', {})
    }
    if (!body.replaceValues?.length) {
      throw new PError('NO_REPLACE_VALUES', {})
    }

    // Group targets by machineId for efficient processing
    const targetsByMachine = new Map<number, typeof body.targets>()
    for (const target of body.targets) {
      const existing = targetsByMachine.get(target.machineId) || []
      existing.push(target)
      targetsByMachine.set(target.machineId, existing)
    }

    let totalUpdated = 0

    for (const [machineId, targets] of targetsByMachine) {
      const machine = await machineStore.get(machineId)
      if (!machine) {
        logger.warn(`Machine ${machineId} not found, skipping`)
        continue
      }

      // İlgili makinenin veritabanında toplu güncelleme işlemini tetikler
      const result = await machine.replaceInPrograms({
        targets,
        originalCommandNo: body.originalCommandNo,
        replaceValues: body.replaceValues,
      })

      totalUpdated += result.updatedCount

      // Replace tamamlandıktan sonra etkilenen programları arşive kaydet.
      // Arşiv işlemi best-effort: başarısız olsa bile replace başarılı sayılır.
      const uniqueProgramNos = [...new Set(targets.map(t => t.programNo))]
      try {
        await machine.archiveUpdatedPrograms(uniqueProgramNos)
      } catch (archiveError) {
        logger.error({ error: archiveError, machineId, programNos: uniqueProgramNos }, 'Failed to archive programs after find-and-replace')
      }
    }

    return {
      success: true,
      operation: 'replace',
      updatedCount: totalUpdated,
    }
  } catch (error: PError | unknown) {
    if (isPError(error)) {
      throw createError({
        statusCode: 400,
        message: error.code,
        data: error.detail,
      })
    }

    logger.error('Error in update-program-steps endpoint:', error)
    throw createError({
      statusCode: 500,
      message: 'INTERNAL_SERVER_ERROR',
      data: error instanceof Error ? error.message : String(error),
    })
  }
})
