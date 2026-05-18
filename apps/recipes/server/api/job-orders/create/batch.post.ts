import type { Knex } from 'knex'
import { dmsDB, getDmExchangeDB } from '~/server/connectionPool'
import { RecipeType } from '~/shared/constants'
import type { CommandParameter, JobOrderParams, RecipeMasterMaterial, RecipeMasterStep, RecipeProgramMaster } from '~/shared/types'
import { isValidPartCountColumn } from '~/server/utils/partCountColumn'

async function insertRecipeMaterials(
  material: RecipeMasterMaterial,
  context: {
    planKey: number
    batchNo: string
    correctionNo: number
    machineId: number
    program: any
    step: any
    programOrder: number
    materialIndex: number
    counter: number
    callOff: number
    callOffManual: number
    isIntermediateStep: boolean
    tankNo: number
    priority: number
    dmExchangeDB: Knex<any, never[]>
    parallelCounters: Map<string, number>
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
    counter,
    callOff,
    callOffManual,
    isIntermediateStep,
    tankNo,
    priority,
    dmExchangeDB,
    programOrder,
    parallelCounters,
  } = context
  const mainStepOrder = step.stepNo + 1
  const parallelKey = `${program.programNo}-${mainStepOrder}`
  const parallelStep = (parallelCounters.get(parallelKey) ?? 0) + 1
  parallelCounters.set(parallelKey, parallelStep)
  await dmsDB('BATCH_RECIPE_STEP').insert({
    plan_key: planKey,
    material_code: material.materialCode,
    amount: material.amount,
    unit: material.unit,
    batch_order: batchNo,
    recipe_type: step.type,
    main_step: mainStepOrder,
    parallel_step: parallelStep,
    req_no_batch: counter,
    process_order: programOrder + 1,
    prog_proc_no: callOff,
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
    step_no: mainStepOrder,
  }).returning('job_id')

  await dmsDB('MATERIAL_REQUEST').insert({
    req_no: job.job_id,
    recipe_amount: material.calculated,
    status: 0,
    material_code: material.materialCode,
    unit: material.unit,
    ...(connectedDispenser?.dispenserId && { dispenser_id: connectedDispenser.dispenserId }),
    real_amount: material.amount,
    main_step: mainStepOrder,
    parallel_step: parallelStep,
  })
  await dmExchangeDB('Dyelot_Recipe').insert({
    Dyelot: batchNo,
    ReDye: 0,
    ProductCode: material.materialCode,
    ProductName: material.materialName,
    Amount: material.calculated,
    RecipeAmount: material.amount,
    KindOfProduct: material.type === RecipeType.DYE ? 1 : 2,
    KindOfStation: material.isManual ? 5 : 2,
    TreatmentNo: program.programNo,
    Program_order: programOrder + 1,
    Preparation_counter: isIntermediateStep ? callOff : material.orderNo,
    CallOff: callOff,
    Counter: counter,
    Unit: 'gr',
    ...(isIntermediateStep && { CallOffManuel: callOffManual }),
  })
}

async function processProgramSteps(
  program: any,
  index: number,
  context: {
    planKey: number
    batchNo: string
    correctionNo: number
    machineId: number
    tankNo: number
    priority: number
    dmExchangeDB: any
    counterState: { counter: number, callOff: number, callOffManual: number }
  },
) {
  const { planKey, batchNo, dmExchangeDB, counterState } = context
  await dmExchangeDB('Dyelot_Procedure').insert({
    Dyelot: batchNo,
    TreatmentCnt: index + 1,
    TreatmentNo: program.programNo,
  })

  await dmsDB('BATCH_PROGRAM').insert({
    plan_key: planKey,
    program_index: index + 1,
    program_no: program.programNo,
    flotte: program.flotte,
    flotte_ratio: program.flotteRatio,
    weight: program.totalWeight,
  })

  const chemRequests = program.steps.filter(p => p.type === 0)
  const dyeRequests = program.steps.filter(p => p.type === 1)

  if (chemRequests.length > 0) {
    await dmsDB('BATCH_HEADER').insert({
      plan_key: planKey,
      recipe_index: index + 1,
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
      recipe_index: index + 1,
      program_no: program.programNo,
      recipe_type: 1,
      flotte: program.flotte,
      flotte_ratio: program.flotteRatio,
      weight: program.totalWeight,
    })
  }

  const regularMaterials = program.steps
    .flatMap((step, stepIndex) =>
      step.materials.map((material, materialIndex) => ({
        ...material,
        step,
        materialIndex,
        stepIndex,
        isIntermediateStep: false,
      })),
    )

  const manualMaterials = (program.manualSteps || [])
    .flatMap((manualStep, stepIndex) =>
      manualStep.materials.map((material, materialIndex) => ({
        ...material,
        step: { stepNo: manualStep.nextStep, type: manualStep.type },
        materialIndex,
        stepIndex,
        isIntermediateStep: true,
        displayOrderNo: manualStep.nextStep,
      })),
    )

  const allMaterials = [...regularMaterials, ...manualMaterials]
    .sort((a: any, b: any) => {
      const aOrder = a.isIntermediateStep ? a.displayOrderNo - 0.5 : a.orderNo
      const bOrder = b.isIntermediateStep ? b.displayOrderNo - 0.5 : b.orderNo
      return aOrder - bOrder
    })

  counterState.callOffManual = 0
  const parallelCounters = new Map<string, number>()

  for (let i = 0; i < allMaterials.length; i++) {
    const material = allMaterials[i]
    counterState.counter++

    let currentCallOff: number
    if (material.isIntermediateStep) {
      currentCallOff = material.displayOrderNo
      counterState.callOffManual++
    } else {
      if (i === 0 || allMaterials[i - 1].orderNo < material.orderNo || allMaterials[i - 1].isIntermediateStep) {
        counterState.callOff++
      }
      currentCallOff = counterState.callOff
    }

    await insertRecipeMaterials(material, {
      ...context,
      program,
      step: material.step,
      materialIndex: material.materialIndex,
      programOrder: index,
      counter: counterState.counter,
      callOff: currentCallOff,
      callOffManual: counterState.callOffManual,
      isIntermediateStep: material.isIntermediateStep,
      parallelCounters,
    })
  }
}

export default defineEventHandler(async (event) => {
  const { recipe, recipeHeader, machines, params, optimizationParams } = await readBody<{
    recipe: RecipeMasterStep[]
    recipeHeader: RecipeProgramMaster
    machines: number[]
    params: JobOrderParams
    optimizationParams: CommandParameter[]
  }>(event)
  const dmExchangeDB = await getDmExchangeDB()
  const tankNo = 0
  const priority = 50

  const companyInfo = await dmsDB('COMPANY_INFO').select('part_count_column').first()
  const rawPartCountColumn = companyInfo?.part_count_column as string | null
  const partCountColumn = rawPartCountColumn && isValidPartCountColumn(rawPartCountColumn)
    ? rawPartCountColumn
    : null
  for (let i = 0; i < params.numberOfJobs; i++) {
    try {
      const machineId = machines[i]
      const batchNo = params.numberOfJobs > 1 ? `${params.jobNo}_${i + 1}` : params.jobNo

      await dmExchangeDB.transaction(async (trx) => {
        await trx('Dyelots').where('Dyelot', batchNo).del()
        await trx('Dyelot_Recipe').where('Dyelot', batchNo).del()
        await trx('Dyelot_Procedure').where('Dyelot', batchNo).del()
        await trx('Dyelot_Parameter').where('Dyelot', batchNo).del()

        const counterState = {
          counter: 0,
          callOff: 0,
          callOffManual: 0,
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
          recipe_id: recipeHeader.recipeId,
          order_no: params.orderNo,
          flotte: params.flotte,
          total_weight: params.totalWeight,
          notes: params.notes,
          customer_name: params.customerName,
          fabric_type: params.fabricType,
          as_no: params.ASNo,
          yarn: params.yarn,
          part_count: params.partCount,
        })

        const dyelotParamRows: Array<{
          Dyelot: string,
          TreatmentCnt: number,
          TreatmentParaCnt: number,
          TreatmentParaNo: number,
          TreatmentParaValue: number
        }> = []

        for (let index = 0; index < recipe.length; index++) {
          const program = recipe[index]
          await processProgramSteps(program, index, {
            planKey,
            batchNo,
            correctionNo,
            machineId,
            tankNo,
            priority,
            dmExchangeDB: trx,
            counterState,
          })
          const opParams = optimizationParams.filter(
            p => p.programNo === program.programNo,
          )

          if (opParams.length > 0) {
            dyelotParamRows.push(
              ...opParams.map(p => ({
                Dyelot: batchNo,
                TreatmentCnt: index + 1,
                TreatmentParaCnt: p.paramId,
                TreatmentParaNo: p.paramIndex,
                TreatmentParaValue: p.selectedValue,
              })),
            )
          }
        }
        if (dyelotParamRows.length > 0) {
          await trx('Dyelot_Parameter').insert(dyelotParamRows)
        }
        await trx('Dyelots').insert({
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
          ...(partCountColumn && params.partCount != null && { [partCountColumn]: params.partCount }),
        })
      })
    }
    catch (error: any) {
      setResponseStatus(event, 400, error.message)
      return event.node.res.end()
    }
  }
  return { success: true }
})
