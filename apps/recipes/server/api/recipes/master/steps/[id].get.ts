import { dmsDB } from '~/server/connectionPool'
import type { ManualStep, RecipeMasterStep } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { machineId } = getQuery(event)

  // Fetch regular materials
  const rawRecipeSteps = await dmsDB('RECIPE_MASTER_STEP as s')
    .select({
      recipeId: 's.recipe_id',
      machineId: 'p.machine_id',
      programNo: 's.program_no',
      programName: 'p.program_name',
      programOrder: 's.step_no',
      stepNo: 'm.step_no',
      programIndex: 'm.program_index',
      chemRequests: 'p.chem_requests',
      dyeRequests: 'p.dye_requests',
      saltRequests: 'p.salt_requests',
      type: 'm.type',
      materialCode: 'm.material_code',
      materialName: 'mat.material_name',
      isManual: 'mat.is_manual',
      unit: 'm.unit',
      amount: 'm.amount',
      nextStep: 'm.next_step',
    })
    .leftJoin('RECIPE_MASTER as mas', function () {
      this.on('mas.recipe_id', 's.recipe_id')
        .andOn('mas.machine_id', 's.machine_id')
    })
    .leftJoin('PROGRAM_HEADER as p', (builder) => {
      builder
        .on('s.program_no', 'p.program_no')
        .andOn('p.machine_id', 'mas.machine_id')
    })
    .leftJoin('RECIPE_MASTER_MATERIAL as m', function () {
      this.on('s.recipe_id', '=', 'm.recipe_id')
        .andOn('s.program_no', '=', 'm.program_no')
        .andOn('s.step_no', '=', 'm.program_index')
        .andOn('s.type', '=', 'm.type')
        .andOn('s.machine_id', '=', 'm.machine_id')
    })
    .leftJoin('MATERIAL as mat', 'm.material_code', 'mat.material_code')
    .where('s.recipe_id', id)
    .andWhere('s.machine_id', machineId)
    .where(builder => builder.whereNull('m.step_no').orWhere('m.step_no', '!=', -1)) // Exclude intermediate steps, allow NULL (no materials)
    .orderBy('s.step_no')

  // Fetch intermediate materials (step_no = -1)
  const intermediateSteps = await dmsDB('RECIPE_MASTER_MATERIAL as m')
    .select({
      programNo: 'm.program_no',
      programIndex: 'm.program_index',
      type: 'm.type',
      materialCode: 'm.material_code',
      materialName: 'mat.material_name',
      isManual: 'mat.is_manual',
      unit: 'm.unit',
      amount: 'm.amount',
      nextStep: 'm.next_step',
    })
    .leftJoin('MATERIAL as mat', 'm.material_code', 'mat.material_code')
    .where('m.recipe_id', id)
    .andWhere('m.machine_id', machineId)
    .andWhere('m.step_no', -1) // Only intermediate steps
    .whereNotNull('m.next_step')
    .orderBy('m.next_step')

  const recipeSteps: RecipeMasterStep[] = []
  rawRecipeSteps.forEach((row) => {
    let program = recipeSteps.find(s => row.programNo === s.programNo && s.stepNo === row.programOrder)

    if (!program) {
      program = {
        recipeId: row.recipeId,
        machineId,
        programNo: row.programNo,
        programName: row.programName,
        stepNo: row.programOrder,
        chemRequests: row.chemRequests,
        dyeRequests: row.dyeRequests,
        saltRequests: row.saltRequests,
        steps: [],
        manualSteps: [],
      }
      recipeSteps.push(program)
    }

    if (row.materialCode != null) {
      let programSteps = program.steps.find(s => s.stepNo === row.programIndex && s.stepNo === row.programOrder && s.type === row.type)
      if (!programSteps) {
        programSteps = { type: row.type, stepNo: row.programIndex, materials: [] }
        program.steps.push(programSteps)
      }
      programSteps.materials.push({
        materialCode: row.materialCode,
        materialName: row.materialName,
        type: row.type,
        unit: row.unit,
        isManual: row.isManual,
        amount: Number(row.amount),
        orderNo: row.stepNo,
        programIndex: row.programIndex,
        nextStep: row.nextStep,
        calculated: 0,
      })
    }
  })

  // Add manual steps to programs
  intermediateSteps.forEach((row) => {
    const program = recipeSteps.find(s => s.programNo === row.programNo && s.stepNo === row.programIndex)
    if (program) {
      if (!program.manualSteps) {
        program.manualSteps = []
      }

      let intStep = program.manualSteps.find((is: ManualStep) => is.nextStep === row.nextStep && is.type === row.type)
      if (!intStep) {
        intStep = { nextStep: row.nextStep, type: row.type, materials: [] }
        program.manualSteps.push(intStep)
      }

      intStep.materials.push({
        materialCode: row.materialCode,
        materialName: row.materialName,
        type: row.type,
        unit: row.unit,
        isManual: row.isManual,
        amount: Number(row.amount),
        orderNo: -1,
        programIndex: row.programIndex,
        nextStep: row.nextStep,
        calculated: 0,
      })
    }
  })

  return recipeSteps
})
