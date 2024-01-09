import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { reasonId, reasonText } = await readBody(event)

  const res = await knex('BFSTEPSKIPPINGREASONS').insert({
    ID: reasonId,
    REASONTEXT: reasonText,
  })

  return res
})
