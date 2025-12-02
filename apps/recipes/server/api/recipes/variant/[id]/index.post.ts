import { dmsDB } from '~/server/connectionPool'
import { RecipeType } from '~/shared/constants'
import type { RecipeMasterStep, RecipeVariant } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { variant, steps } = await readBody<{ variant: RecipeVariant, steps: RecipeMasterStep[] }>(event)
  const { id } = getRouterParams(event)
  const { machineId } = getQuery(event)
  try {
    await dmsDB('RECIPE_VARIANT').insert({
      recipe_id: id,
      machine_id: machineId,
      variant_name: variant.variantName,
      color_code: variant.colorCode,
      color_name: variant.colorName,
      prep_time: new Date(),
      last_update: new Date(),
    })
    await dmsDB('RECIPE_VARIANT_MATERIAL').where('recipe_id', id).andWhere('machine_id', machineId).andWhere('variant_name', variant.variantName).del()
    await dmsDB('RECIPE_VARIANT_STEP').where('recipe_id', id).andWhere('machine_id', machineId).andWhere('variant_name', variant.variantName).del()

    const stepData = steps.flatMap((step, index) =>
      [RecipeType.CHEM, RecipeType.DYE, RecipeType.SALT].map(type => ({
        recipe_id: id,
        machine_id: machineId,
        variant_name: variant.variantName,
        program_no: step.programNo,
        step_no: index,
        type,
      })),
    )
    if (stepData.length > 0)
      await dmsDB('RECIPE_VARIANT_STEP').insert(stepData)

    const materialData: any[] = []
    steps.forEach((program) => {
      program.steps.forEach((step) => {
        step.materials.forEach((material) => {
          materialData.push({
            recipe_id: id,
            machine_id: machineId,
            program_no: program.programNo,
            step_no: material.orderNo,
            type: step.type,
            material_code: material.materialCode,
            unit: material.unit,
            amount: material.amount,
            program_index: program.stepNo,
            variant_name: variant.variantName,
            next_step: material.nextStep ?? null,
          })
        })
      })
      // Handle manual steps
      program.manualSteps?.forEach((intStep) => {
        intStep.materials.forEach((material) => {
          materialData.push({
            recipe_id: id,
            machine_id: machineId,
            program_no: program.programNo,
            step_no: -1,
            type: material.type,
            material_code: material.materialCode,
            unit: material.unit,
            amount: material.amount,
            program_index: program.stepNo,
            variant_name: variant.variantName,
            next_step: intStep.nextStep,
          })
        })
      })
    })
    if (materialData.length > 0) {
      await dmsDB('RECIPE_VARIANT_MATERIAL').insert(materialData)
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
