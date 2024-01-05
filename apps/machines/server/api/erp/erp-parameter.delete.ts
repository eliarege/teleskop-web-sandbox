import { knex } from '~/server/connectionPool'
import type { ErpParameter } from '~/types'

export default defineEventHandler(async (event) => {
  const { erpParameter } = await readBody(event)

  return await knex('BFERPPARAMETERDEFINITIONS')
    .where({
      MACHINEID: erpParameter.machineId,
      PARAMID: erpParameter.paramId,
    }).del()
})
