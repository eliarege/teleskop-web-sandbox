import { withTbbFtpClient } from '@teleskop/tbb-ftp-client'
import { z } from 'zod'
import { knex } from '~/server/connectionPool'
import { updateProjectTranslations } from '~/server/utils/updateDatabase'

const machineIdSchema = z.object({
  machineId: z.number().int().positive(),
})

export default defineAuthEventHandler(async (event) => {
  const { machineId } = await readValidatedBody(event, machineIdSchema.parse)
  const machine = await knex('BFMACHINES')
    .where('MACHINEID', machineId)
    .select({ ip: 'IP' })
    .first()
  if (!machine) {
    throw createError({ statusCode: 404, message: 'Machine not found' })
  }

  await withTbbFtpClient(machine.ip, async (tbb) => {
    await knex.transaction(async (trx) => {
      await updateProjectTranslations(machineId, tbb, trx)
    })
  })

  return { success: true }
})
