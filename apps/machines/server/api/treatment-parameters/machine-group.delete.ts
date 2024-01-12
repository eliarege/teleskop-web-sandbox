import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event)
  return await knex('BFTREATMENTPARAMETERGROUPS')
    .where('ID', id)
    .del()
})
