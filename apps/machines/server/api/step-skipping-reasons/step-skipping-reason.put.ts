import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { id, reasonText } = await readBody(event)

    const res = await knex('BFSTEPSKIPPINGREASONS').where('ID', id)
      .update({
        REASONTEXT: reasonText,
      })

    return res
  } catch (e) {
    return e
  }
})
