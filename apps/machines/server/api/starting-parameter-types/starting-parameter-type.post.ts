import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, paramTypeId, paramId } = await readBody(event)

  const existingRecord = await knex('BFMACHBATCHPARAMETERTYPES')
    .where('MACHINEID', machineId)
    .andWhere('PARAMTYPEID', paramTypeId)
    .first()

  if (existingRecord) {
    await knex('BFMACHBATCHPARAMETERTYPES')
      .where('MACHINEID', machineId)
      .andWhere('PARAMTYPEID', paramTypeId)
      .update({
        PARAMID: paramId,
      })
  } else {
    await knex('BFMACHBATCHPARAMETERTYPES').insert({
      MACHINEID: machineId,
      PARAMTYPEID: paramTypeId,
      PARAMID: paramId,
    })
  }
})
