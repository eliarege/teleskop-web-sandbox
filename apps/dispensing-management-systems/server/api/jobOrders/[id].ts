import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { id } = getRouterParams(event)
    const jobOrders = dmsDB('JOB_ORDER as j')
    .leftJoin(
      "DISPENSER as d",
      "j.dispenser_id",
      "=",
      "d.dispenser_id"
    )
    .leftJoin(
      "MACHINE as m",
      "j.machine_id",
      "=",
      "m.machine_id"
    )
    .select({
      jobId: 'j.job_id',
      batchCorrectionNo: 'j.batch_correction_no',
      machineName: 'm.machine_name',
      machineId: 'm.machine_id',
      dispenserId: 'j.dispenser_id',
      tankNo: 'j.tank_no',
      programNo: 'j.program_no',
      programName: 'j.program_name',
      recipeType: 'j.recipe_type',
      recipeProcessNo: 'j.recipe_process_no',
      stepNo: 'j.step_no',
      recipeStepNo: 'j.recipe_step_no',
      status: 'j.status'
    })
    .orderBy('job_id',"desc")
    .where('j.dispenser_id','=',id)

    jobOrders.limit(1000)
    return await jobOrders
  } catch (e) {
    console.log(e)
    return e
  }
})
