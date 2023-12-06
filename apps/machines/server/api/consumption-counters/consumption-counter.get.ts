import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)

    return await knex('BFCONSUMPTIONCOUNTERS')
      .select({
        counter1: 'COUNTER1',
        counter2: 'COUNTER2',
      })
      .where('MACHINEID', machineId).first()
  } catch (err) {
    console.log('err = ', err)
    return err
  }
})
