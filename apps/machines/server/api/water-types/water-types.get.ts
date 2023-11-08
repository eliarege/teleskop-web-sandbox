import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    return await knex('BFWaterTypes').select({
      waterTypeId: 'waterTypeId',
      waterTypeName: 'waterTypeName',
    })
  } catch (err) {
    console.error(err)
  }
})
