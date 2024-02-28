import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, tankNo } = await readBody(event)
  await knex('BFMACHINETANKS')
    .where({
      MACHINEID: machineId,
      TANKNO: tankNo,
    })
    .del()
})
