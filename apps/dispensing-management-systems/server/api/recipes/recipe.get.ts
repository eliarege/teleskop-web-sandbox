import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { batchNo, correctionNo } = getQuery(event)
  let planKey
  if (Number(correctionNo)) {
    planKey = dmsDB('BATCH_PLAN')
      .where('batch', batchNo)
      .andWhere('batch_correction_no', correctionNo)
      .select('plan_key')
  } else {
    planKey = dmsDB('BATCH_PLAN')
      .where('batch', batchNo)
      .orderBy('plan_key', 'desc')
      .limit(1)
      .select('plan_key')
  }
  const res = await dmsDB('BATCH_RECIPE_STEP as r')
    .select({
      planKey: 'r.plan_key',
      processOrder: 'r.process_order',
      ISN: 'r.req_no_batch',
      mainStep: 'r.main_step',
      parallelStep: 'r.parallel_step',
      chemCode: 'r.chem_code',
      materialName: 'm.material_name',
      programProcessNo: 'r.prog_proc_no',
      amount: 'r.amount',
      unit: 'r.unit',
    })
    .where('r.plan_key', planKey)
    .leftJoin('MATERIAL as m', 'm.material_code', '=', 'r.chem_code')
    .whereNotNull('req_no_batch')
    .orderBy(['r.process_order', 'r.prog_proc_no', 'r.parallel_step'])

  return res
})
