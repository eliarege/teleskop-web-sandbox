import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)

    return await knex('BFMACHCOUNTER')
      .select({
        id: 'ID',
        name: 'NAME',
      })
      .where('MACHINEID', machineId)
  } catch (err) {
    console.log('err = ', err)
    return err
  }
})
