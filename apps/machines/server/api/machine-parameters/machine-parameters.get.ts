import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const machines = await knex('BFMACHPARAMETERS')
    .where('MACHINEID', machineId)
    .select({
      machineParameterId: 'MACHINEPARAMETERID',
      machineId: 'MACHINEID',
      paramString: 'PARAMSTRING',
      paramLowLimit: 'PARAMLOWLIMIT',
      paramHighLimit: 'PARAMHIGHLIMIT',
      parameterType: 'PARAMETERTYPE',
      selectionList: 'SELECTIONLIST',
      unitCode: 'UNITCODE',
      selectionValues: 'SELECTIONVALUES',
      isDeleted: 'ISDELETED',
      tbbChangeTime: 'TBBCHANGETIME',
      changeTime: 'CHANGETIME',
      defaultValue: 'DEFAULTVALUE',
      dmArea: 'dmArea',
      consScreen: 'consScreen',
      consFormat: 'consFormat',
      constUnit: 'consUnit',
      currentValue: 'currentValue',
    })
    .orderBy('MACHINEID')
  return machines
})
