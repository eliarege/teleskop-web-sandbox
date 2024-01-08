import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  return await knex('BFMACHBATCHPARAMETERTYPES')
    .leftOuterJoin('BFMACHBATCHPARAMETERS', function () {
      this
        .on('BFMACHBATCHPARAMETERTYPES.PARAMID', 'BFMACHBATCHPARAMETERS.BATCHPARAMETERID')
        .andOn('BFMACHBATCHPARAMETERTYPES.MACHINEID', 'BFMACHBATCHPARAMETERS.MACHINEID')
    })
    .select({
      paramTypeId: 'PARAMTYPEID',
      paramId: 'PARAMID',
      paramString: 'PARAMSTRING',
    })
    .where('BFMACHBATCHPARAMETERTYPES.MACHINEID', machineId)
    .orderBy('PARAMTYPEID')
})
