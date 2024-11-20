import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { waterTypeId, waterTypeName } = await readBody(event)

  const res = await knex('BFWaterTypes').where('waterTypeId', waterTypeId)
    .update({
      waterTypeName,
    })

  return res
})
