import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineEventHandler(async () => {
  const selectParams = {
    machineId: 'BFMACHINES.MACHINEID',
    machineCode: 'MACHINECODE',
  }

  return await knex('BFMACHINES')
    .leftJoin('BFTREATMENTPARAMETERGROUPMACHINES', 'BFTREATMENTPARAMETERGROUPMACHINES.MACHINEID', 'BFMACHINES.MACHINEID')
    .select(selectParams)
    .whereNotExists(function () {
      this.select('BFMACHINES.MACHINEID')
        .from('BFTREATMENTPARAMETERGROUPMACHINES')
        .whereRaw('BFTREATMENTPARAMETERGROUPMACHINES.MACHINEID = BFMACHINES.MACHINEID')
    })
})
