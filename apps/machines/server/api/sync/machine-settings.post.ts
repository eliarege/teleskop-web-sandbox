import { withTbbFtpClient } from '@teleskop/tbb-ftp-client'
import { knex } from '~/server/connectionPool'
import type { Setting } from '~/types'

export default defineAuthEventHandler(async (event) => {
  const { machines, settings } = await readBody(event)

  if (!machines?.length) {
    throw createError({
      statusCode: 400,
      message: 'No machines selected',
    })
  }

  if (!settings?.length) {
    throw createError({
      statusCode: 400,
      message: 'No settings selected',
    })
  }

  let system: Record<string, string> = {}
  const results: Array<{ machineId: string, ip: string, success: boolean, error?: string }> = []

  const numMachineIds = machines.map((machineId: string) => Number.parseInt(machineId))

  const machineData = await knex('BFMACHINES')
    .select('MACHINEID', 'IP')
    .whereIn('MACHINEID', numMachineIds)

  for (const machine of machineData) {
    const { MACHINEID: machineId, IP: ip } = machine

    try {
      await withTbbFtpClient(ip, async (tbb) => {
        // 30 saniye timeout ayarla
        system = await tbb.fetchSystemParams()

        settings.forEach((newSetting: Setting) => {
          if (system[newSetting.caption] !== undefined) {
            system[newSetting.caption] = newSetting.isActive ? '1' : '0'
          }
        })

        await tbb.uploadSystemParams(system)
      })

      results.push({
        machineId: machineId.toString(),
        ip,
        success: true,
      })
    } catch (error: any) {
      console.error(`Failed to update machine ${machineId} (${ip}):`, error)

      results.push({
        machineId: machineId.toString(),
        ip,
        success: false,
        error: error.message || 'Unknown error',
      })
    }
  }

  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  return {
    success: failCount === 0,
    totalMachines: results.length,
    successCount,
    failCount,
    results,
  }
})
