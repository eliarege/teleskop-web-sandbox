import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { changedParameterTypes } = await readBody(event)

  for (const paramType of changedParameterTypes) {
    const { machineId, id, paramId } = paramType

    const existingRecord = await knex('BFMACHBATCHPARAMETERTYPES')
      .where('MACHINEID', machineId)
      .andWhere('PARAMTYPEID', id)
      .first()

    if (existingRecord) {
      await knex('BFMACHBATCHPARAMETERTYPES')
        .where('MACHINEID', machineId)
        .andWhere('PARAMTYPEID', id)
        .update({
          PARAMID: paramId,
        })
    } else {
      await knex('BFMACHBATCHPARAMETERTYPES').insert({
        MACHINEID: machineId,
        PARAMTYPEID: id,
        PARAMID: paramId,
      })
    }
  }
})
