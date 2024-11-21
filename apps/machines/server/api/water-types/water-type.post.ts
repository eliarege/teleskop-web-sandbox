import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { waterTypeName } = await readBody(event)

  const maxId = await knex('BFWaterTypes').max('waterTypeId as waterTypeId').first()
  const waterTypeId = (maxId?.waterTypeId ?? 0) + 1
  const res = await knex('BFWaterTypes')
    .insert({
      waterTypeId,
      waterTypeName,
    })
  return res
})
