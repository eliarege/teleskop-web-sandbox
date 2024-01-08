import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id, reasonText } = await readBody(event)
  const res = await knex('BFSTEPSKIPPINGREASONS')
    .insert({
      ID: id,
      REASONTEXT: reasonText,
    })
  return res
})
