import { dmsDB } from '~/server/connectionPool'
import type { WeighingAuto } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { batchNo, correctionNo } = getQuery(event)
  const autoWeighing: WeighingAuto[] = await dmsDB('JOB_ORDER as B')
    .select({
      programNo: 'B.program_no',
      machineName: 'M.machine_name',
      dispenserId: 'A.dispenser_id',
      processOrder: 'B.recipe_process_no',
      mainStep: 'A.main_step',
      parallelStep: 'A.parallel_step',
      materialCode: 'A.material_code',
      materialName: 'C.material_name',
      recipeAmount: 'A.recipe_amount',
      actualAmount: 'A.real_amount',
      status: 'A.status',
      requestTime: 'B.request_time',
      completedTime: 'B.completed_time',
      machineid: 'B.machine_id',
      interval: dmsDB.raw('EXTRACT(epoch FROM ?? - ??)', ['B.completed_time', 'B.request_time']),
    },
    )
    .join('MATERIAL_REQUEST as A', 'A.req_no', 'B.job_id')
    .join('MACHINE as M', 'B.machine_id', 'M.machine_id')
    .join('MATERIAL as C', 'A.material_code', 'C.material_code')
    .where('B.batch_no', batchNo)
    .andWhere('B.batch_correction_no', correctionNo)
    .orderBy(['B.request_time', 'A.parallel_step'])
  return autoWeighing
})
