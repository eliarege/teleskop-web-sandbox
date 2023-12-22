import { filtersToKnex } from 'utils/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { tankDefinition, rowName, value } = await readBody(event)

    return await knex('DYTFMATERIALTANKMAP')
      .where({
        MACHINEID: tankDefinition.machineId,
        MATERIALCODE: tankDefinition.materialCode,
        TANKNO: tankDefinition.tankNo,
      })
      .update(rowName.toUpperCase(), value)
  } catch (e) {
    console.log('e = ', e)
    return e
  }
})
