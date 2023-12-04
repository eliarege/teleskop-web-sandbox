import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)

    return await knex('BFMACHBATCHPARAMETERS')
      .where('MACHINEID', machineId)
      .select({
        paramId: 'BATCHPARAMETERID',
        paramString: 'PARAMSTRING',
      })
  } catch (err) {
    console.log('err = ', err)
    return err
  }
})
