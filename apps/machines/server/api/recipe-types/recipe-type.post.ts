import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { typeName } = await readBody(event)
  const res = await knex('BFRECIPETYPES')
    .insert({
      TYPENAME: typeName,
    })
  return res
})
