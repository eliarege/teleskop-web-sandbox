import { knex } from '~/server/connectionPool'
import type { ErpParameter } from '~/types'

export default defineEventHandler(async (event) => {
  const { erpParameter, machineId, paramId } = await readBody(event)

  return await knex('BFERPPARAMETERDEFINITIONS')
    .insert({
      MACHINEID: machineId,
      PARAMID: paramId,
      PARAMNAME: erpParameter.paramName,
      ERPFIELDNAME: erpParameter.erpFieldName,
    })
})
