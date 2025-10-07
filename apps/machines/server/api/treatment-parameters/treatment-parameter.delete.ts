import { knex } from '~/server/connectionPool'
import type { TreatmentParameter } from '~/types'

export default defineAuthEventHandler(async (event) => {
  const { id } = await readBody(event)

  const result = await knex('BFTREATMENTPARAMETERS')
    .where({
      ID: id,
    }).del()

  return {
    success: true,
    message: 'PARAMETER_DELETED_SUCCESSFULLY',
    deletedCount: result,
  }
})
