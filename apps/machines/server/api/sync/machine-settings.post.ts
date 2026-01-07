import type { TbbFtpClient } from '@teleskop/tbb-ftp-client'
import { withTbbFtpClient } from '@teleskop/tbb-ftp-client'
import { isDef } from '@teleskop/utils'
import z from 'zod'
import { knex } from '~/server/connectionPool'

const bodySchema = z.object({
  machines: z.array(z.coerce.number().int().positive()).min(1),
  settings: z.array(
    z.object({
      caption: z.string(),
      isActive: z.boolean(),
    }),
  ).min(1),
})

export default defineAuthEventHandler(async (event) => {
  const { machines, settings } = await readValidatedBody(event, bodySchema.parse)

  const res = await createTaskStream(event, async (ctx) => {
    const machineRows = await knex('BFMACHINES')
      .select({ id: 'MACHINEID', hostname: 'IP' })
      .whereIn('MACHINEID', machines)

    const totalMachines = machineRows.length
    for (const [index, machine] of machineRows.entries()) {
      ctx.cancellation.throwIfCancelled()
      ctx.logger.info(`Processing machine ${machine.id} (${machine.hostname}) (${index + 1}/${totalMachines})`)

      try {
        await withTbbFtpClient(machine.hostname, async (tbb: TbbFtpClient) => {
          const system = await tbb.fetchSystemParams()

          settings.forEach((newSetting) => {
            if (isDef(system[newSetting.caption])) {
              system[newSetting.caption] = newSetting.isActive ? '1' : '0'
            }
          })

          await tbb.uploadSystemParams(system)
        }, { timeout: 2000 })
      } catch (err) {
        ctx.logger.error(`Failed to update machine ${machine.id} (${machine.hostname}): ${(err as Error).message}`)
      } finally {
        ctx.state.progress(Math.floor((index + 1) / totalMachines * 100))
      }
    }
    ctx.state.complete('Machine settings synchronization complete.')
  })

  return res.kind === 'stream' ? res.stream : res
})
