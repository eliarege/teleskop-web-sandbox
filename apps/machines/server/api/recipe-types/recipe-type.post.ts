import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { id, typeName } = await readBody(event)
    const res = await knex('BFRECIPETYPES')
      .insert({
        ID: id,
        TYPENAME: typeName,
      })
    return res
  } catch (e) {
    return e
  }
})
