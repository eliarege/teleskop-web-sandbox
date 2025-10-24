import { dmsDB } from '~/server/connectionPool'
import type { RecipeType } from '~/shared/constants'
import type { ContinueJobOrderParams, RecipeProgramMasterStep } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { machineId, recipeType, params, recipe }: { machineId: number, recipeType: RecipeType, params: ContinueJobOrderParams, recipe: RecipeProgramMasterStep[] } = await readBody(event)
  const correctionNo = 1
  const tankNo = 0
  const priority = 50
  // TODO: USE PARAMS
  if (params.jobNo) {
    const jobNoExists = (await dmsDB('JOB_ORDER').select().where({ batch_no: params.jobNo })).length > 0
    if (jobNoExists)
      return { error: 'Batch no already exists' }
  }
  recipe.forEach(async (step) => {
    const job = await dmsDB('JOB_ORDER').insert({
      ...(params.jobNo && { batch_no: params.jobNo }),
      batch_correction_no: correctionNo,
      tank_no: tankNo,
      program_no: -1,
      dispenser_id: step.dispenserId,
      machine_id: machineId,
      status: 0,
      recipe_type: recipeType,
      request_time: new Date(),
      priority,
      type: 0,
      // TODO: FIX THESE
      recipe_process_no: step.mainStep,
      recipe_step_no: step.parallelStep,
      step_no: step.mainStep,
    }).returning('job_id')
    await dmsDB('MATERIAL_REQUEST').insert({
      req_no: job[0].job_id,
      recipe_amount: step.amount,
      status: 0,
      material_code: step.materialCode,
      unit: step.unit,
      dispenser_id: step.dispenserId,
      // TODO: FIX THESE
      real_amount: step.amount,
      main_step: step.mainStep,
      parallel_step: step.parallelStep,
    })
  })
  const res = await dmsDB('JOB_ORDER_HEADER').insert({
    job_no: params.jobNo,
    flotte: params.flotte,
    foulard: params.foulard,
    start_date: params.startDate,
    fabric_size: params.fabricSize,
    fabric_weight: params.fabricWeight,
    grammage: params.grammage,
    color_code: params.colorCode,
    volume: params.volume
  })
  return res
})
