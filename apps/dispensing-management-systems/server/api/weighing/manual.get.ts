import { dmsDB } from '~/server/connectionPool'
import type { WeighingAuto } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { batchNo, correctionNo } = getQuery(event)
  const manualWeighing: WeighingAuto[] = await dmsDB('DUST_MATERIAL_REQUEST as A')
    .select({
      batchNo: 'A.batch_no',
      correctionNo: 'A.correction_no',
      weighingNumber: 'A.queue_no',
      recipeType: 'A.recipe_type',
      materialCode: 'B.material_code',
      materialName: 'C.material_name',
      actualAmount: 'B.real_amount',
      status: 'A.status',
      requestTime: 'A.request_time',
    })
    .join('DUST_MATERIAL as B', 'A.req_no', 'B.req_no')
    .join('MATERIAL as C', 'B.material_code', 'C.material_code')
    .where('A.batch_no', batchNo)
    .andWhere('A.correction_no', correctionNo)
  return manualWeighing
})
