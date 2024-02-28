import { withTbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  let system

  const numMachineId = Number.parseInt(machineId as string)
  if (Number.isNaN(numMachineId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
    })
  }

  const ip = await knex('BFMACHINES')
    .select('IP')
    .where('MACHINEID', machineId)
    .first()
    .then(row => row ? row.IP : null)

  await withTbbFtpClient(ip, async (tbb) => {
    system = await tbb.fetchSystemParams()
  })

  return system
})
