import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, maxReelSpeed } = await readBody<{ machineId: number, maxReelSpeed: number }>(event)

  await knex('BFMACHINES').where({
    MACHINEID: machineId,
  }).update({
    MAXREELSPEED: maxReelSpeed,
  })
})
