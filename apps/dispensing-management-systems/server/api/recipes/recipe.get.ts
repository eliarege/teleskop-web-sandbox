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
  const machineId = dmsDB('BATCH_PLAN')
    .select('planned_machine')
    .where('plan_key', planKey)

  const res = await dmsDB('BATCH_RECIPE_STEP as r')
    .where('r.plan_key', planKey)
    .select({
      planKey: 'r.plan_key',
      processOrder: 'r.process_order',
      recipeType: 'm.material_group_no',
      ISN: 'r.req_no_batch',
      mainStep: 'r.main_step',
      parallelStep: 'r.parallel_step',
      chemCode: 'r.chem_code',
      materialName: 'm.material_name',
      programProcessNo: 'r.prog_proc_no',
      amount: 'r.amount',
      unit: 'r.unit',
      programNo: 'p.program_no',
      programName: 'p.program_name',
    })
    .leftJoin('BATCH_HEADER as h', (builder) => {
      builder
        .on('r.plan_key', '=', 'h.plan_key')
        .andOn('r.process_order', '=', 'h.recipe_index')
    })
    .leftJoin('PROGRAM_HEADER as p', (builder) => {
      builder
        .on('h.recipe_no', '=', 'p.program_no')
        .andOn('p.machine_id', '=', machineId)
    })
    .leftJoin('MATERIAL as m', 'm.material_code', '=', 'r.chem_code')
    .whereNotNull('req_no_batch')
    .orderBy(['r.process_order', 'r.prog_proc_no', 'r.parallel_step'])

  return res
})
