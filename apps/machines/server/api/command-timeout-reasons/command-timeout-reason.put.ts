import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { reasonText, id } = await readBody(event)

    const res = await knex('BFCOMMANDTIMEOUTREASONS')
      .where('ID', id)
      .update({
        REASONTEXT: reasonText,
      })

    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
