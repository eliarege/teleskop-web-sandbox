import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { waterTypeId, waterTypeName } = await readBody(event)
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
