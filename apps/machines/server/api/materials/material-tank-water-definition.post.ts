import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { tankDefinition, rowName, value } = await readBody(event)

  return await knex('DYTFMATERIALTANKMAP')
    .where({
      MACHINEID: tankDefinition.machineId,
      MATERIALCODE: tankDefinition.materialCode,
      TANKNO: tankDefinition.tankNo,
    })
    .update(rowName.toUpperCase(), value)
})
