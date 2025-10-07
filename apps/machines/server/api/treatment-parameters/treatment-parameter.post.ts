import { knex } from '~/server/connectionPool'
import type { TreatmentParameter } from '~/types'

export default defineAuthEventHandler(async (event) => {
  const { treatmentParameter } = await readBody(event)

  const existingParameter = await knex('BFTREATMENTPARAMETERS')
    .where('TREATMENTPARAMETER', treatmentParameter)
    .first()

  if (existingParameter) {
    throw createError({
      statusCode: 409,
      statusMessage: 'PARAMETER_ALREADY_EXISTS',
    })
  }

  const result = await knex('BFTREATMENTPARAMETERS')
    .insert({
      TREATMENTPARAMETER: treatmentParameter,
    })

  return {
    success: true,
    message: 'PARAMETER_CREATED_SUCCESSFULLY',
    insertedId: result[0],
  }
})
