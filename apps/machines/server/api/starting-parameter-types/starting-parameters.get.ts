import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  return await knex('BFERPPARAMETERDEFINITIONS')
    .where('MACHINEID', machineId)
    .select({
      paramId: 'PARAMID',
      paramString: 'PARAMNAME',
    })
})
