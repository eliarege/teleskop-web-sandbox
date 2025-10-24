import { dmsDB } from '~/server/connectionPool'
import type { MaterialRequest } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { batch } = getQuery(event)
  const materialRequests: MaterialRequest[] = await dmsDB('MATERIAL_REQUEST as r')
    .join(
      'MATERIAL as m',
      'm.material_code',
      '=',
      'r.material_code',
    )
    .leftJoin(
      'BATCH_PLAN as p',
      'p.plan_key',
      '=',
      'r.req_no'
    )
    .select({
      materialName: 'm.material_name',
      materialCode: 'r.material_code',
      recipeAmount: 'r.recipe_amount',
      realAmount: 'r.real_amount',
      mainStep: 'r.main_step',
      parallelStep: 'r.parallel_step',
      dispenserId: 'r.dispenser_id',
      status: 'r.status',
      unit: 'r.unit',
    })
    .where('p.batch', '=', batch)
  return materialRequests
})
