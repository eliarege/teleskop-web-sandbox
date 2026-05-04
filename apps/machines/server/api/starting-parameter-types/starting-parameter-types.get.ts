import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  return await knex('BFMACHBATCHPARAMETERTYPES as T')
    .leftJoin('BFMACHBATCHPARAMETERS as P', function () {
      this
        .on('T.PARAMID', '=', 'P.BATCHPARAMETERID')
        .andOn('T.MACHINEID', '=', 'P.MACHINEID')
    })
    .where('T.MACHINEID', machineId)
    .select({
      paramTypeId: 'T.PARAMTYPEID',
      paramId: 'T.PARAMID',
      paramString: 'P.PARAMSTRING',
    })
    .orderBy('T.PARAMTYPEID')
})
