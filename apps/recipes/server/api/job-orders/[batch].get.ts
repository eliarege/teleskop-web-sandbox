import type { Knex } from 'knex'
import { dmsDB } from '~/server/connectionPool'
import type { JobOrderParams, Machine, RecipeMasterMaterial, RecipeMasterStep, RecipeProgramMaster } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const batchNo = getRouterParam(event, 'batch')

  if (!batchNo) {
    throw createError({
      statusCode: 400,
      message: 'Invalid batch number',
    })
  }

  try {
    const batchPlan = await dmsDB('BATCH_PLAN')
      .where('batch', batchNo)
      .orderBy('batch_correction_no', 'desc')
      .first()

    if (!batchPlan) {
      throw createError({
        statusCode: 404,
        message: 'Batch not found',
      })
    }

    const planKey = batchPlan.plan_key

    const batchHeaders = await dmsDB('BATCH_HEADER')
      .where('plan_key', planKey)
      .orderBy('recipe_index')

    const recipeSteps = await dmsDB('BATCH_RECIPE_STEP')
      .where('plan_key', planKey)
      .orderBy(['prog_proc_no', 'main_step', 'parallel_step'])

    const jobOrders = await dmsDB('JOB_ORDER')
      .where({ batch_no: batchNo })
      .orderBy('job_id')

    const materialRequests = await dmsDB('MATERIAL_REQUEST')
      .whereIn('req_no', jobOrders.map(j => j.job_id))

    const materialCodes = [...new Set(recipeSteps.map(s => s.material_code))]
    const materials = await dmsDB('MATERIAL')
      .select('material_code', 'material_name')
      .whereIn('material_code', materialCodes)

    const materialNameMap = new Map(materials.map(m => [m.material_code, m.material_name]))

    const programsMap = new Map<number, RecipeMasterStep>()

    for (const header of batchHeaders) {
      const programNo = header.program_no

      if (!programsMap.has(programNo)) {
        programsMap.set(programNo, {
          recipeId: 0,
          programNo,
          programName: '',
          stepNo: header.recipe_index,
          machineId: batchPlan.planned_machine,
          flotteRatio: header.flotte_ratio,
          totalWeight: header.weight,
          flotte: header.flotte,
          steps: [],
          chemRequests: 0,
          dyeRequests: 0,
          saltRequests: 0,
          chemSteps: [],
          dyeSteps: [],
          saltSteps: [],
        })
      }
    }

    // Group recipe steps by program and step
    const stepsMap = new Map<string, any>()

    // Create a lookup map for recipe steps by material_code and main_step
    for (const step of recipeSteps) {
      // Find the corresponding job order for this recipe step
      // Match by recipe_type, main_step, and material through material_request
      const jobOrder = jobOrders.find((j) => {
        if (j.step_no !== step.main_step || j.recipe_type !== step.recipe_type) {
          return false
        }

        // Check if this job order's material request matches the step
        const matReq = materialRequests.find(m =>
          m.req_no === j.job_id
          && m.material_code === step.material_code
          && m.main_step === step.main_step
          && m.parallel_step === step.parallel_step,
        )

        return !!matReq
      })

      if (!jobOrder)
        continue

      // Find the material request for this job order
      const materialRequest = materialRequests.find(m =>
        m.req_no === jobOrder.job_id
        && m.material_code === step.material_code
        && m.main_step === step.main_step
        && m.parallel_step === step.parallel_step,
      )

      if (!materialRequest)
        continue

      const stepKey = `${jobOrder.program_no}-${step.main_step}-${step.recipe_type}`

      if (!stepsMap.has(stepKey)) {
        stepsMap.set(stepKey, {
          stepNo: step.main_step,
          type: step.recipe_type,
          materials: [],
        })
      }

      const stepData = stepsMap.get(stepKey)
      stepData.materials.push({
        materialCode: step.material_code,
        materialName: materialNameMap.get(step.material_code) || '',
        amount: materialRequest.real_amount,
        unit: materialRequest.unit,
        orderNo: step.main_step,
        programIndex: step.main_step,
        type: step.recipe_type,
        isManual: step.main_step === -1,
        calculated: materialRequest.recipe_amount,
      })
    }

    // Assign steps to programs
    for (const [stepKey, stepData] of stepsMap) {
      const [programNoStr] = stepKey.split('-')
      const programNo = Number(programNoStr)
      const program = programsMap.get(programNo)

      if (program) {
        // Sort materials by orderNo
        stepData.materials.sort((a: RecipeMasterMaterial, b: RecipeMasterMaterial) => a.orderNo - b.orderNo)
        program.steps.push(stepData)
      }
    }

    const steps = Array.from(programsMap.values())

    // TODO: Recipe params
    const recipeParams: RecipeProgramMaster = {
      recipeId: batchPlan.recipe_id ?? 0,
      recipeName: '',
      recipeGroup: 0,
      recipeType: 0,
      machineId: batchPlan.planned_machine,
      comment: '',
      prepTime: batchPlan.planned_start_date,
      lastUpdate: batchPlan.planned_start_date,
      stepNo: 0,
      programNo: 0,
      colorCode: batchPlan.color_code,
      colorName: batchPlan.color_name,
      isPassive: false,
      variantName: '',
    }

    const params: JobOrderParams = {
      jobNo: batchNo,
      numberOfJobs: 1,
      totalWeight: batchPlan.total_weight,
      flotteRatio: batchPlan.flotte / batchPlan.total_weight,
      flotte: batchPlan.flotte,
      partyNo: 0,
      orderNo: batchPlan.order_no || 0,
      notes: batchPlan.notes || '',
      customerName: batchPlan.customer_name || '',
      fabricType: batchPlan.fabric_type || '',
      yarn: batchPlan.yarn || '',
      ASNo: batchPlan.as_no || '',
    }

    const machines: Machine[] = [{
      machineId: batchPlan.planned_machine,
      machineName: '',
      machineGroup: 0,
      controllerType: 0,
      capacity: null,
      connectedDispensers: null,
    }]

    // Determine request time from JOB_ORDERs (earliest request_time)
    const requestTime: string | null = jobOrders.length > 0 && jobOrders[0].request_time
      ? new Date(
        jobOrders
          .map(j => new Date(j.request_time as Date))
          .sort((a, b) => a.getTime() - b.getTime())[0],
      ).toISOString()
      : null
    return {
      steps,
      recipeParams,
      params,
      machines,
      recipeId: batchPlan.recipe_id ?? 0,
      requestTime,
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch job order',
    })
  }
})
