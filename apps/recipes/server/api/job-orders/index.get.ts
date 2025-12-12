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
    .select({
      jobId: 'j.job_id',
      batchNo: 'j.batch_no',
      batchCorrectionNo: 'j.batch_correction_no',
      machineName: 'm.machine_name',
      machineId: 'm.machine_id',
      dispenserId: 'j.dispenser_id',
      requestTime: 'j.request_time',
      tankNo: 'j.tank_no',
      programNos: dmsDB.raw(`(
        SELECT array_agg(DISTINCT j2.program_no)
        FROM JOB_ORDER j2
        WHERE j2.batch_no = j.batch_no
      )`),
      programNames: dmsDB.raw(`(
        SELECT array_agg(DISTINCT ph.program_name)
        FROM "JOB_ORDER" j2
        JOIN "PROGRAM_HEADER" ph ON ph.program_no = j2.program_no AND ph.machine_id = j2.machine_id
        WHERE j2.batch_no = j.batch_no
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
