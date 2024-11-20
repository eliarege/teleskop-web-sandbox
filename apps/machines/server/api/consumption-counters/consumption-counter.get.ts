import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  return await knex('BFCONSUMPTIONCOUNTERS')
    .select({
      counter1: 'COUNTER1',
      counter2: 'COUNTER2',
    })
    .where('MACHINEID', machineId).first()
})
