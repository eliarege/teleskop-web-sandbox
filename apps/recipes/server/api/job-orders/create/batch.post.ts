import type { Knex } from 'knex'
import { dmsDB, getDmExchangeDB } from '~/server/connectionPool'
import { RecipeType } from '~/shared/constants'
import type { CommandParameter, JobOrderParams, RecipeMasterMaterial, RecipeMasterStep, RecipeProgramMaster } from '~/shared/types'

async function insertRecipeMaterials(
  material: RecipeMasterMaterial,
  context: {
    planKey: number
    batchNo: number
    correctionNo: number
    machineId: number
    program: any
    step: any
    processIndex: number
    materialIndex: number
    counter: number
    callOff: number
    tankNo: number
    priority: number
    dmExchangeDB: Knex<any, never[]>
  },
) {
  const {
    planKey,
    batchNo,
    correctionNo,
    machineId,
    program,
    step,
    materialIndex,
    processIndex,
    counter,
    callOff,
    tankNo,
    priority,
    dmExchangeDB,
  } = context
  await dmsDB('BATCH_RECIPE_STEP').insert({
    plan_key: planKey,
    material_code: material.materialCode,
    amount: material.amount,
    batch_order: batchNo,
    recipe_type: step.type,
    main_step: step.stepNo,
    parallel_step: materialIndex,
    req_no_batch: materialIndex,
    process_order: processIndex,
    prog_proc_no: processIndex,
  })

  const connectedDispenser = await dmsDB('DISPENSER_MATERIAL_CONNECTION')
    .select({ dispenserId: 'dispenser_id' })
    .where('material_code', material.materialCode)
    .first()

  const [job] = await dmsDB('JOB_ORDER').insert({
    batch_no: batchNo,
    batch_correction_no: correctionNo,
    tank_no: tankNo,
    program_no: program.programNo,
    ...(connectedDispenser?.dispenserId && { dispenser_id: connectedDispenser.dispenserId }),
    machine_id: machineId,
    status: 0,
    recipe_type: step.type,
    request_time: new Date(),
    priority,
    type: 1,
    recipe_process_no: step.stepNo,
    recipe_step_no: program.stepNo,
    step_no: step.stepNo,
  }).returning('job_id')

  await dmsDB('MATERIAL_REQUEST').insert({
    req_no: job.job_id,
    recipe_amount: material.calculated,
    status: 0,
    material_code: material.materialCode,
    unit: material.unit,
    ...(connectedDispenser?.dispenserId && { dispenser_id: connectedDispenser.dispenserId }),
    real_amount: material.amount,
    main_step: step.stepNo,
    parallel_step: materialIndex,
  })
  await dmExchangeDB('Dyelot_Recipe').insert({
    Dyelot: batchNo,
    ReDye: 0,
    ProductCode: material.materialCode,
    ProductName: material.materialName,
    Amount: material.calculated,
    RecipeAmount: material.amount,
    KindOfProduct: material.type === RecipeType.DYE? 1 : 2,
    KindOfStation: material.isManual ? 1 : 2,
    TreatmentNo: program.programNo,
    Program_order: program.stepNo + 1,
    Preparation_counter: material.orderNo,
    CallOff: callOff,
    Counter: counter,
    Unit: 'gr',
  })
}

async function processProgramSteps(
  program: any,
  index: number,
  context: {
    planKey: number
    batchNo: number
    correctionNo: number
    machineId: number
    tankNo: number
    priority: number
    dmExchangeDB: any
    counterState: { counter: number, callOff: number }
  },
) {
  const { planKey, batchNo, dmExchangeDB, counterState } = context
  await dmExchangeDB('Dyelot_Procedure').insert({
    Dyelot: batchNo,
    TreatmentCnt: index + 1,
    TreatmentNo: program.programNo,
  })

  const chemRequests = program.steps.filter(p => p.type === 0)
  const dyeRequests = program.steps.filter(p => p.type === 1)

  if (chemRequests.length > 0) {
    await dmsDB('BATCH_HEADER').insert({
      plan_key: planKey,
      recipe_index: index,
      program_no: program.programNo,
      recipe_type: 0,
      flotte: program.flotte,
      flotte_ratio: program.flotteRatio,
      weight: program.totalWeight,
    })
  }

  if (dyeRequests.length > 0) {
    await dmsDB('BATCH_HEADER').insert({
      plan_key: planKey,
      recipe_index: index,
      program_no: program.programNo,
      recipe_type: 1,
      flotte: program.flotte,
      flotte_ratio: program.flotteRatio,
      weight: program.totalWeight,
    })
  }

  const allMaterials = program.steps
    .flatMap((step, stepIndex) =>
      step.materials.map((material, materialIndex) => ({
        ...material,
        step,
        materialIndex,
        stepIndex,
      })),
    )
    .sort((a: RecipeMasterMaterial, b: RecipeMasterMaterial) => a.orderNo - b.orderNo)

  for (let i = 0; i < allMaterials.length; i++) {
    const material = allMaterials[i]
    counterState.counter++
    if (i === 0 || allMaterials[i - 1].orderNo < material.orderNo) {
      counterState.callOff++
    }
    await insertRecipeMaterials(material, {
      ...context,
      program,
      step: material.step,
      materialIndex: material.materialIndex,
      processIndex: material.stepIndex,
      counter: counterState.counter,
      callOff: counterState.callOff,
    })
  }
}

export default defineEventHandler(async (event) => {
  const { recipe, recipeHeader, machines, params, optimizationParams } = await readBody<{
    recipe: RecipeMasterStep[]
    recipeHeader: RecipeProgramMaster
    machines: number[]
    params: JobOrderParams,
    optimizationParams: CommandParameter[]
  }>(event)
  const dmExchangeDB = await getDmExchangeDB()
  const tankNo = 0
  const priority = 50
  for (let i = 0; i < params.numberOfJobs; i++) {
    try {
      const machineId = machines[i]
      const batchNo = Number(params.jobNo) + i

      const counterState = {
        counter: 0,
        callOff: 0,
      }
      const correctionNoQuery = await dmsDB('BATCH_PLAN')
        .where('batch', batchNo)
        .max('batch_correction_no as maxCorrectionNo')
        .first()
      const correctionNo = correctionNoQuery?.maxCorrectionNo ? correctionNoQuery.maxCorrectionNo + 1 : 1

      const planKeyQuery = await dmsDB('BATCH_PLAN')
        .max('plan_key as maxPlanKey')
        .first()
      const planKey = planKeyQuery?.maxPlanKey ? planKeyQuery?.maxPlanKey + 1 : 1

      await dmsDB('BATCH_PLAN').insert({
        plan_key: planKey,
        batch: batchNo,
        batch_correction_no: correctionNo,
        planned_machine: machineId,
        planned_start_date: new Date(),
        color_code: recipeHeader.colorCode,
        color_name: recipeHeader.colorName,
        order_no: params.orderNo,
        flotte: params.flotte,
        total_weight: params.totalWeight,
        notes: params.notes,
        customer_name: params.customerName,
        fabric_type: params.fabricType,
        as_no: params.ASNo,
        yarn: params.yarn
      })

      for (let index = 0; index < recipe.length; index++) {
        const program = recipe[index]
        await processProgramSteps(program, index, {
          planKey,
          batchNo,
          correctionNo,
          machineId,
          tankNo,
          priority,
          dmExchangeDB,
          counterState,
        })
        const opParams = optimizationParams.filter(
          p => p.programNo === program.programNo
        )

        if (opParams.length > 0) {
          await dmExchangeDB('Dyelot_Parameter').insert(opParams.map(p => ({
            Dyelot: batchNo,
            TreatmentCnt: index + 1,
            TreatmentParaCnt: p.paramId,
            TreatmentParaNo:  p.paramIndex,
            TreatmentParaValue: p.selectedValue
          })))
        }
      }
      await dmExchangeDB('Dyelots').insert({
        Dyelot: batchNo,
        ExternalDyelot: batchNo,
        ReDye: 0,
        Machine: machineId,
        Color: recipeHeader.colorCode,
        OrderNo: params.orderNo,
        Customer: params.customerName,
        RecipeNo: recipeHeader.recipeId,
        Weight: params.totalWeight,
        LiquorRatio: params.flotteRatio,
        LiquorQuantity: params.flotte,
        ImportState: 1,
        State: 1,
      })
    } catch (error: any) {
      setResponseStatus(event, 400, error.message)
      return event.node.res.end()
    }
  }
  return { success: true }
})
