import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
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
        tankNo: 'j.tank_no',
        programNo: 'j.program_no',
        programName: 'p.program_name',
        recipeType: 'j.recipe_type',
        recipeProcessNo: 'j.recipe_process_no',
        stepNo: 'j.step_no',
        recipeStepNo: 'j.recipe_step_no',
        status: 'j.status',
      })
      .orderBy('job_id', 'desc')

    const { dispenserId } = getQuery(event)
    if (dispenserId) {
      jobOrders = jobOrders.where('j.dispenser_id', '=', dispenserId)
    }

    jobOrders = jobOrders.limit(1000)
    return await jobOrders
  } catch (e) {
    console.log(e)
    return e
  }
})
