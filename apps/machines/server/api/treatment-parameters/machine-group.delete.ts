import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { id } = await readBody(event)

  const result = await knex('BFTREATMENTPARAMETERGROUPS')
    .where('ID', id)
    .del()

  return {
    success: true,
    message: 'GROUP_DELETED_SUCCESSFULLY',
    deletedCount: result,
  }
})
