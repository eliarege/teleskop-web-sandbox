import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  let jobOrders = dmsDB('JOB_ORDER as j')
    .leftJoin(
      'MACHINE as m',
      'j.machine_id',
      '=',
      'm.machine_id',
    )
    .leftJoin(
      'PROGRAM_HEADER as p',
      (builder) => {
        builder
          .on('j.program_no', 'p.program_no')
          .andOn('j.machine_id', 'p.machine_id')
      },
    )
    .leftJoin('BATCH_PLAN as b', (builder) => {
      builder
        .on('b.batch', '=', 'j.batch_no')
        .andOn('b.batch_correction_no', '=', 'j.batch_correction_no')
    })
    .select({
      jobId: 'j.job_id',
      batchNo: 'j.batch_no',
      batchCorrectionNo: 'j.batch_correction_no',
      machineName: 'm.machine_name',
      machineId: 'm.machine_id',
      dispenserId: 'j.dispenser_id',
      recipeName: dmsDB.raw(`(
        SELECT rm.recipe_name
        FROM "RECIPE_MASTER" rm
        WHERE rm.recipe_id = b.recipe_id AND rm.machine_id = j.machine_id
        LIMIT 1
      )`),
      requestTime: 'j.request_time',
      tankNo: 'j.tank_no',
      programNos: dmsDB.raw(`(
        SELECT array_agg(bprog.program_no ORDER BY bprog.program_index)
        FROM "BATCH_PROGRAM" bprog
        WHERE bprog.plan_key = b.plan_key
      )`),
      programNames: dmsDB.raw(`(
        SELECT array_agg(ph.program_name ORDER BY bprog.program_index)
        FROM "BATCH_PROGRAM" bprog
        LEFT JOIN "PROGRAM_HEADER" ph ON ph.program_no = bprog.program_no AND ph.machine_id = b.planned_machine
        WHERE bprog.plan_key = b.plan_key
      )`),
      type: 'j.type',
      recipeType: 'j.recipe_type',
      recipeProcessNo: 'j.recipe_process_no',
      stepNo: 'j.step_no',
      recipeStepNo: 'j.recipe_step_no',
      priority: 'priority',
      status: 'j.status',
    })
    .orderBy('job_id', 'desc')

  const { dispenserId } = getQuery(event)
  if (dispenserId) {
    jobOrders = jobOrders.where('j.dispenser_id', '=', dispenserId)
  }

  jobOrders = jobOrders.limit(1000)
  const rows = await jobOrders
  return rows
})
