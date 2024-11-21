import { knex } from '~/server/connectionPool'
import type { TreatmentParameter } from '~/types'

export default defineAuthEventHandler(async () => {
  const treatmentParameter: TreatmentParameter[] = await knex('BFTREATMENTPARAMETERS')
    .select({
      id: 'ID',
      unit: 'UNIT',
      treatmentParameter: 'TREATMENTPARAMETER',
      minValue: 'MINVALUE',
      maxValue: 'MAXVALUE',
    },
    )
  return treatmentParameter
})
