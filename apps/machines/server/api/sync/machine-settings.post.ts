import type { TbbFtpClient } from '@teleskop/tbb-ftp-client'
import { withTbbFtpClient } from '@teleskop/tbb-ftp-client'
import { isDef } from '@teleskop/utils'
import z from 'zod'
import { knex } from '~/server/connectionPool'
import { deviceSettings } from '~/shared/constants'

const bodySchema = z.object({
  machines: z.array(z.coerce.number().int().positive()).min(1),
  settings: z.array(
    z.object({
      name: z.enum(deviceSettings as [string, ...string[]]),
      isActive: z.boolean(),
    }),
  ).min(1),
})

export default defineAuthEventHandler(async (event) => {
  const { machines, settings } = await readValidatedBody(event, bodySchema.parse)
  const t = await useTranslation(event)

  const res = await createTaskStream(event, async (ctx) => {
    const machineRows = await knex('BFMACHINES')
      .select({
        id: 'MACHINEID',
        name: 'MACHINECODE',
        hostname: 'IP',
      })
      .whereIn('MACHINEID', machines)

    const totalMachines = machineRows.length
    let anySucceeded = false
    let anyFailed = false

    for (const [index, machine] of machineRows.entries()) {
      ctx.cancellation.throwIfCancelled()

      try {
        await withTbbFtpClient(machine.hostname, async (tbb: TbbFtpClient) => {
          const system = await tbb.fetchSystemParams()

          settings.forEach((newSetting) => {
            if (isDef(system[newSetting.name])) {
              system[newSetting.name] = newSetting.isActive ? '1' : '0'
            }
          })

          await tbb.uploadSystemParams(system)
          ctx.logger.info(`${t('updateMachineSettings.updated', {
            machine: machine.name,
          })} (${machine.hostname})`)
          anySucceeded = true
        }, { timeout: 2000 })
      } catch (err) {
        ctx.logger.error(`${t('updateMachineSettings.error', {
          machine: machine.name,
        })} (${machine.hostname}): ${(err as Error).message}`)
        anyFailed = true
      } finally {
        ctx.state.progress(Math.floor((index + 1) / totalMachines * 100))
      }
    }
    if (anySucceeded) {
      if (anyFailed) {
        ctx.logger.warn(t('updateMachineSettings.completedWithErrors'))
      }
      ctx.state.complete()
    } else {
      ctx.state.fail(t('updateMachineSettings.failed'))
    }
  })

  return res.kind === 'stream' ? res.stream : res
})
