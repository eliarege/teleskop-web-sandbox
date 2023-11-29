import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { waterTypeName } = await readBody(event)

    const maxId = await knex('BFWaterTypes').max('waterTypeId as waterTypeId').first()
    const waterTypeId = maxId.waterTypeId + 1
    const res = await knex('BFWaterTypes')
      .insert({
        waterTypeId,
        waterTypeName,
      })
    return res
  } catch (e) {
    return e
  }
})
