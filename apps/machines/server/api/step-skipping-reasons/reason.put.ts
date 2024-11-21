import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { id, reasonText, oldId } = await readBody(event)

  const res = await knex('BFSTEPSKIPPINGREASONS')
    .where('ID', oldId)
    .update({
      ID: id,
      REASONTEXT: reasonText,
    })

  return res
})
