import { db as knex } from '../database'
import type { TreatmentParams } from '~/shared/types'

export default defineEventHandler(async () => {
  const treatmentParams: TreatmentParams[] = await knex({ b: 'BFTREATMENTPARAMGROUPMAP' })
    .select({
      commandNo: 'b.COMMANDNO',
      parameterIndex: 'b.PARAMETERINDEX',
    })
  return treatmentParams
})
