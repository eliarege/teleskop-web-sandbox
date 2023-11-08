import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    return await knex('BFSTEPSKIPPINGREASONS').select({
      id: 'ID',
      reasonText: 'REASONTEXT',
    })
  } catch (err) {
    console.error(err)
  }
})
