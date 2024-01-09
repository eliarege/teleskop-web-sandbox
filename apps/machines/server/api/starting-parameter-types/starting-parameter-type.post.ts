import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, paramTypeId, paramId } = await readBody(event)

  return await knex('BFMACHBATCHPARAMETERTYPES')
    .where('MACHINEID', machineId).andWhere('PARAMTYPEID', paramTypeId)
    .update({
      PARAMID: paramId,
    })
})
