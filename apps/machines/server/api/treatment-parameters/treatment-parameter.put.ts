import { knex } from '~/server/connectionPool'
import type { TreatmentParameter } from '~/types'

export default defineAuthEventHandler(async (event) => {
  const { id, treatmentParameter } = await readBody(event)

  const existingParameter = await knex('BFTREATMENTPARAMETERS')
    .where('TREATMENTPARAMETER', treatmentParameter)
    .whereNot('ID', id)
    .first()

  if (existingParameter) {
    throw createError({
      statusCode: 409,
      statusMessage: 'PARAMETER_ALREADY_EXISTS',
    })
  }

  const result = await knex('BFTREATMENTPARAMETERS')
    .where('ID', id)
    .update({
      TREATMENTPARAMETER: treatmentParameter,
    })

  return {
    success: true,
    message: 'PARAMETER_UPDATED_SUCCESSFULLY',
    updatedCount: result,
  }
})
