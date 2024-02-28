import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  console.log('machineId = ', machineId)

  return await knex('BFMACHBATCHPARAMETERS')
    .where('MACHINEID', machineId)
    .select({
      paramId: 'BATCHPARAMETERID',
      paramString: 'PARAMSTRING',
    })
})
