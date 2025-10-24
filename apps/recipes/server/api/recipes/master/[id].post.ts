import { dmsDB } from '~/server/connectionPool'
import { RecipeType } from '~/shared/constants'
import type { RecipeMasterStep, RecipeProgramMaster } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { recipeHeader, steps } = await readBody<{ recipeHeader: RecipeProgramMaster, steps: RecipeMasterStep[] }>(event)
  const { id } = getRouterParams(event)
  try {
    await dmsDB('RECIPE_MASTER').update({
      recipe_name: recipeHeader.recipeName,
      machine_id: recipeHeader.machineId,
      recipe_group: recipeHeader.recipeGroup,
      recipe_comment: recipeHeader.comment,
      recipe_type: recipeHeader.recipeType,
      color_code: recipeHeader.colorCode,
      color_name: recipeHeader.colorName,
      last_update: new Date()
    }).where('recipe_id', id).andWhere('machine_id', recipeHeader.machineId)
    await dmsDB('RECIPE_MASTER_MATERIAL').where('recipe_id', id).andWhere('machine_id',recipeHeader.machineId).del()
    await dmsDB('RECIPE_MASTER_STEP').where('recipe_id', id).andWhere('machine_id',recipeHeader.machineId).del()

    const stepData = steps.flatMap((step, index) =>
      [RecipeType.CHEM, RecipeType.DYE, RecipeType.SALT].map(type => ({
        recipe_id: id,
        machine_id: recipeHeader.machineId,
        program_no: step.programNo,
        step_no: index,
        type,
      })),
    )
    if (stepData.length > 0)
      await dmsDB('RECIPE_MASTER_STEP').insert(stepData)

    const materialData: any[] = []
    steps.forEach((program) => {
      program.chemSteps?.forEach((step) => {
        step.materials.forEach((material) => {
          materialData.push({
            recipe_id: id,
            machine_id: recipeHeader.machineId,
            program_no: program.programNo,
            step_no: step.orderNo,
            type: RecipeType.CHEM,
            material_code: material.materialCode,
            unit: material.unit,
            amount: material.amount,
            program_index: program.stepNo,
          })
        })
      })
      program.dyeSteps?.forEach((step) => {
        step.materials.forEach((material) => {
          materialData.push({
            recipe_id: id,
            machine_id: recipeHeader.machineId,
            program_no: program.programNo,
            step_no: step.orderNo,
            type: RecipeType.DYE,
            material_code: material.materialCode,
            unit: material.unit,
            amount: material.amount,
            program_index: program.stepNo,
          })
        })
      })
      program.saltSteps?.forEach((step) => {
        step.materials.forEach((material) => {
          materialData.push({
            recipe_id: id,
            machine_id: recipeHeader.machineId,
            program_no: program.programNo,
            step_no: step.orderNo,
            type: RecipeType.SALT,
            material_code: material.materialCode,
            unit: material.unit,
            amount: material.amount,
            program_index: program.stepNo,
          })
        })
      })
    })
    if (materialData.length > 0) {
      await dmsDB('RECIPE_MASTER_MATERIAL').insert(materialData)
    }

    return { success: true }
  } catch (e) {
    console.error(e)
    const error = {
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'An unexpected error occurred.',
    }
    throw createError(error)
  }
})
