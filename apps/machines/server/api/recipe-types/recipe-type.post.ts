import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { typeName } = await readBody(event)
    const res = await knex('BFRECIPETYPES')
      .insert({
        TYPENAME: typeName,
      })
    return res
  } catch (e) {
    return e
  }
})
