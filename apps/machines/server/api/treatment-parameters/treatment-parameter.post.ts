import { knex } from '~/server/connectionPool'
import type { TreatmentParameter } from '~/types'

export default defineAuthEventHandler(async (event) => {
  const { treatmentParameter } = await readBody(event)
  return await knex('BFTREATMENTPARAMETERS')
    .insert({
      TREATMENTPARAMETER: treatmentParameter,
    })
})
