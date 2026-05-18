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

    const batchHeaders = await dmsDB('BATCH_PROGRAM as h')
      .leftJoin('PROGRAM_HEADER as ph', (join) => {
        join
          .on('h.program_no', 'ph.program_no')
          .andOn('ph.machine_id', '=', batchPlan.planned_machine)
      })
      .where('h.plan_key', planKey)
      .orderBy('h.program_index')
      .select('h.*', 'ph.program_name as program_name')

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
      const programIndex = header.program_index

      if (!programsMap.has(programIndex)) {
        programsMap.set(programIndex, {
          recipeId: 0,
          programNo,
          programName: header.program_name || '',
          stepNo: programIndex,
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

    // Compute per-program request order rank for prog_proc_no.
    // prog_proc_no (callOff) is a global counter across the whole batch; we need the
    // 1-based rank within each (process_order, recipe_type) group to recover the
    // original CHEM/DYE/SALT request number as it was defined in the recipe.
    const progProcRankMap = new Map<string, number>()
    {
      const groupValues = new Map<string, Set<number>>()
      for (const step of recipeSteps) {
        const key = `${step.process_order}-${step.recipe_type}`
        if (!groupValues.has(key))
          groupValues.set(key, new Set())
        groupValues.get(key)!.add(step.prog_proc_no)
      }
      for (const [key, vals] of groupValues) {
        const sorted = Array.from(vals).sort((a, b) => a - b)
        sorted.forEach((val, idx) => progProcRankMap.set(`${key}-${val}`, idx + 1))
      }
    }

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

      // Rank of prog_proc_no within the program = the original request order number
      const orderNo = progProcRankMap.get(`${step.process_order}-${step.recipe_type}-${step.prog_proc_no}`) ?? 1

      // Key by prog_proc_no so each request slot is its own step group
      const stepKey = `${step.process_order}-${step.prog_proc_no}-${step.recipe_type}`

      if (!stepsMap.has(stepKey)) {
        stepsMap.set(stepKey, {
          stepNo: orderNo,
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
        orderNo,
        programIndex: step.process_order,
        type: step.recipe_type,
        isManual: false,
        calculated: materialRequest.recipe_amount,
      })
    }

    // Assign steps to programs
    for (const [stepKey, stepData] of stepsMap) {
      const [processOrderStr] = stepKey.split('-')
      const processOrder = Number(processOrderStr)
      const program = programsMap.get(processOrder)

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
      partCount: batchPlan.part_count || undefined,
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
