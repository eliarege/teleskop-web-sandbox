import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, tankNo } = await readBody(event)
  await knex('BFMACHINETANKS')
    .where({
      MACHINEID: machineId,
      TANKNO: tankNo,
    })
    .del()
})
