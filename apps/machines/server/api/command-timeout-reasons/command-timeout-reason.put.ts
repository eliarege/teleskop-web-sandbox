import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { reasonText, id } = await readBody(event)

  const res = await knex('BFCOMMANDTIMEOUTREASONS')
    .where('ID', id)
    .update({
      REASONTEXT: reasonText,
    })

  return res
})
