import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { reasonName } = await readBody(event)

    const res = await knex('BFCOMMANDTIMEOUTREASONS').insert({
      GROUPID: 1,
      REASONTEXT: reasonName,
      ISDELETED: 0,
    })

    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
