import { dmsDB } from '~/server/connectionPool'
import { RecipeType } from '~/shared/constants'

export default defineEventHandler(async (event) => {
  const { templateName, steps } = await readBody(event)
  const { recipeid } = getRouterParams(event)
  try {
    await dmsDB('JOB_ORDER_TEMPLATE_HEADER').update({
      template_name: templateName,
    }).where('recipe_id', recipeid)
    await dmsDB('JOB_ORDER_TEMPLATE_MATERIAL').where('recipe_id', recipeid).andWhere('template_name', templateName).del()
    await dmsDB('JOB_ORDER_TEMPLATE_STEP').where('recipe_id', recipeid).andWhere('template_name', templateName).del()

    const stepData = steps.map((step, index) => ({
      recipe_id: recipeid,
      template_name: templateName,
      program_no: step.programNo,
      step_no: index,
      flotte: step.flotte,
      weight: step.weight
    }))

    await dmsDB('JOB_ORDER_TEMPLATE_MATERIAL').insert(stepData)

    const materialData: any[] = []

    steps.forEach((step) => {
      step.chemSteps?.forEach((material) => {
        materialData.push({
          recipe_id: recipeid,
          template_name: templateName,
          program_no: step.programNo,
          step_no: step.stepNo,
          type: RecipeType.CHEM,
          material_code: material.materialCode,
          unit: material.unit,
          amount: material.amount,
        })
      })
      step.dyeSteps?.forEach((material) => {
        materialData.push({
          recipe_id: recipeid,
          template_name: templateName,
          program_no: step.programNo,
          step_no: step.stepNo,
          type: RecipeType.DYE,
          material_code: material.materialCode,
          unit: material.unit,
          amount: material.amount,
        })
      })
      step.saltSteps?.forEach((material) => {
        materialData.push({
          recipe_id: recipeid,
          template_name: templateName,
          program_no: step.programNo,
          step_no: step.stepNo,
          type: RecipeType.SALT,
          material_code: material.materialCode,
          unit: material.unit,
          amount: material.amount,
        })
      })
    })

    if (materialData.length > 0) {
      await dmsDB('JOB_ORDER_TEMPLATE_MATERIAL').insert(materialData)
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
