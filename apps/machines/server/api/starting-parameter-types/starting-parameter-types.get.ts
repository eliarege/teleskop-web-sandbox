import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  return await knex('BFMACHBATCHPARAMETERTYPES')
    .leftOuterJoin('BFMACHBATCHPARAMETERS', function () {
      this
        .on('BFMACHBATCHPARAMETERTYPES.PARAMID', '=', 'BFMACHBATCHPARAMETERS.BATCHPARAMETERID')
        .andOn('BFMACHBATCHPARAMETERTYPES.MACHINEID', '=', 'BFMACHBATCHPARAMETERS.MACHINEID')
    })
    .where('BFMACHBATCHPARAMETERTYPES.MACHINEID', machineId)
    .select({
      paramTypeId: 'PARAMTYPEID',
      paramId: 'PARAMID',
      paramString: 'PARAMSTRING',
    })
    .orderBy('PARAMTYPEID')
})
