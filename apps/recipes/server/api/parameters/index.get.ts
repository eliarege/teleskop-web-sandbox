import { dmsDB } from '~/server/connectionPool'
import type { BatchPlanParameter } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { batchNo, correctionNo } = getQuery(event)
  const planKey = dmsDB('BATCH_PLAN')
    .where('batch', batchNo)
    .andWhere('batch_correction_no', correctionNo)
    .select('plan_key')
  const res: BatchPlanParameter[] = await dmsDB('BATCH_PLAN_PARAMETER')
    .where('plan_key', planKey)
    .select({
      planKey: 'plan_key',
      paramId: 'param_id',
      paramName: 'param_name',
      value: 'value',
      unit: 'unit',
      paramType: 'param_type',
    })
    .orderBy('param_id')
  return res
})
