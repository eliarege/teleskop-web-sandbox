import process from 'node:process'
import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { filters } = await readBody(event)

  const selectParams = {
    machineId: 'BACONTROLLERCLOSEDTIMES.MACHINEID',
    machineCode: 'MACHINECODE',
    autoKey: 'AUTOKEY',
    startTime: 'STARTTIME',
    endTime: 'ENDTIME',
    duration: 'DURATION',
    closedType: 'CLOSEDTYPE',
    archived: 'ARCHIVED',
  }

  const timezoneOffset = useRuntimeConfig().teleskopTimezoneOffset

  const query = knex('BACONTROLLERCLOSEDTIMES')
    .leftJoin('BFMACHINES', 'BFMACHINES.MACHINEID', 'BACONTROLLERCLOSEDTIMES.MACHINEID')
    .select({
      ...selectParams,
      startTime: knex.raw('DATEADD(minute, ?, BACONTROLLERCLOSEDTIMES.STARTTIME)', [timezoneOffset]),
      endTime: knex.raw('DATEADD(minute, ?, BACONTROLLERCLOSEDTIMES.ENDTIME)', [timezoneOffset]),
    })

  if (filters)
    filtersToKnex(filters, selectParams, query)

  return await query
})
