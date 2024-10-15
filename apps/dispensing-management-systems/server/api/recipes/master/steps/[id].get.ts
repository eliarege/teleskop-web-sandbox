import { dmsDB } from '~/server/connectionPool'
import type { RecipeMasterStep } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  const rawRecipeSteps = await dmsDB('RECIPE_MASTER_STEP as s')
    .select({
      recipeId: 's.recipe_id',
      programNo: 's.program_no',
      programName: 'p.program_name',
      programOrder: 's.step_no',
      stepNo: 'm.step_no',
      chemRequests: 'p.chem_requests',
      dyeRequests: 'p.dye_requests',
      saltRequests: 'p.salt_requests',
      type: 'm.type',
      materialCode: 'm.material_code',
      materialName: 'mat.material_name',
      unit: 'm.unit',
      amount: 'm.amount',
    })
    .leftJoin('PROGRAM_HEADER as p', (builder) => {
      builder
        .on('s.program_no', 'p.program_no')
        .andOnVal('p.machine_id', 3)
    })
    .leftJoin('RECIPE_MASTER_MATERIAL as m', function () {
      this.on('s.recipe_id', '=', 'm.recipe_id')
        .andOn('s.program_no', '=', 'm.program_no')
    })
    .leftJoin('MATERIAL as mat', 'm.material_code', 'mat.material_code')
    .where('s.recipe_id', id)
    .orderBy('s.step_no')
  const recipeSteps: RecipeMasterStep[] = []

  rawRecipeSteps.forEach((row) => {
    let program = recipeSteps.find(s => row.programNo === s.programNo)

    if (!program) {
      program = {
        recipeId: row.recipeId,
        programNo: row.programNo,
        programName: row.programName,
        stepNo: row.programOrder,
        chemRequests: row.chemRequests,
        dyeRequests: row.dyeRequests,
        saltRequests: row.saltRequests,
        steps: [],
      }
      recipeSteps.push(program)
    }

    let programSteps = program.steps.find(s => s.stepNo === row.stepNo)
    if (!programSteps) {
      programSteps = { type: row.type, stepNo: row.stepNo, materials: [] }
      program.steps.push(programSteps)
    }

    programSteps.materials.push({
      materialCode: row.materialCode,
      materialName: row.materialName,
      type: row.type,
      unit: row.unit,
      amount: Number(row.amount),
    })
  })
  return recipeSteps
})
