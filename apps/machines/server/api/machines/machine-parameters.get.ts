import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = await getQuery(event)
    const machineParameters = await knex('BFMACHPARAMETERS').where('MACHINEID', machineId).select({
      id: 'MACHINEPARAMETERID',
      paramString: 'PARAMSTRING',
      defaultValue: 'DEFAULTVALUE',
      paramLowLimit: 'PARAMLOWLIMIT',
      paramHighLimit: 'PARAMHIGHLIMIT',
      dmArea: 'dmArea',
      consScreen: 'consScreen',
      consFormat: 'consFormat',
      consUnit: 'consUnit',
      currentValue: 'currentValue',
    })
    return machineParameters
  } catch (e) {
    return e
  }
})
