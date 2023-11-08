import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    return await knex('BFRECIPETYPES').select({
      id: 'ID',
      typeName: 'TYPENAME',
    })
  } catch (err) {
    console.error(err)
  }
})
