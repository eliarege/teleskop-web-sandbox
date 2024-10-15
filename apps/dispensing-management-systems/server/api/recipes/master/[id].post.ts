import { dmsDB } from '~/server/connectionPool'
import type { RecipeMasterStep } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { recipeName, steps } = await readBody<{ recipeName: string, steps: RecipeMasterStep[] }>(event)
  const { id } = getRouterParams(event)
  try {
    await dmsDB('RECIPE_MASTER').update({
      recipe_name: recipeName
    }).where('recipe_id', id)
    await dmsDB('RECIPE_MASTER_MATERIAL').where('recipe_id', id).del()
    await dmsDB('RECIPE_MASTER_STEP').where('recipe_id', id).del()

    const stepData = steps.map((step, index) => ({
      recipe_id: id,
      program_no: step.programNo,
      step_no: index,
    }))

    await dmsDB('RECIPE_MASTER_STEP').insert(stepData)

    const materialData: any[] = []

    steps.forEach((step) => {
      step.steps.forEach((stepType) => {
        stepType.materials.forEach((material) => {
          materialData.push({
            recipe_id: id,
            program_no: step.programNo,
            step_no: stepType.stepNo,
            type: stepType.type,
            material_code: material.materialCode,
            unit: material.unit,
            amount: material.amount,
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
