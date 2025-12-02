import { dmsDB } from '~/server/connectionPool'
import { RecipeType } from '~/shared/constants'
import type { RecipeMasterStep } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { template, machineId } = await readBody<{ template: RecipeMasterStep, machineId: number }>(event)
  const { id } = getRouterParams(event)
  try {
    await dmsDB.transaction(async (trx) => {
      await trx('PROGRAM_TEMPLATE_STEP').where('program_no', id).andWhere('machine_id', machineId).del()
      await trx('PROGRAM_TEMPLATE').where('program_no', id).andWhere('machine_id', machineId).del()

      const stepData = []
      if (template.chemSteps.length > 0) {
        stepData.push({ program_no: id, machine_id: machineId, type: RecipeType.CHEM })
      }
      if (template.dyeSteps.length > 0) {
        stepData.push({ program_no: id, machine_id: machineId, type: RecipeType.DYE })
      }
      if (template.saltSteps.length > 0) {
        stepData.push({ program_no: id, machine_id: machineId, type: RecipeType.SALT })
      }

      if (stepData.length > 0) {
        await trx('PROGRAM_TEMPLATE').insert(stepData)
      }

      const materialData: any[] = []
      template.chemSteps?.forEach((step) => {
        step.materials.forEach((material) => {
          materialData.push({
            program_no: id,
            machine_id: machineId,
            step_no: step.orderNo,
            type: RecipeType.CHEM,
            material_code: material.materialCode,
            unit: material.unit,
            amount: material.amount,
            next_step: material.nextStep ?? null,
          })
        })
      })
      template.dyeSteps?.forEach((step) => {
        step.materials.forEach((material) => {
          materialData.push({
            program_no: id,
            machine_id: machineId,
            step_no: step.orderNo,
            type: RecipeType.DYE,
            material_code: material.materialCode,
            unit: material.unit,
            amount: material.amount,
            next_step: material.nextStep ?? null,
          })
        })
      })
      template.saltSteps?.forEach((step) => {
        step.materials.forEach((material) => {
          materialData.push({
            program_no: id,
            machine_id: machineId,
            step_no: step.orderNo,
            type: RecipeType.SALT,
            material_code: material.materialCode,
            unit: material.unit,
            amount: material.amount,
            next_step: material.nextStep ?? null,
          })
        })
      })
      // Handle manual steps (materials with step_no = -1)
      template.manualSteps?.forEach((intStep) => {
        intStep.materials.forEach((material) => {
          materialData.push({
            program_no: id,
            machine_id: machineId,
            step_no: -1,
            type: intStep.type,
            material_code: material.materialCode,
            unit: material.unit,
            amount: material.amount,
            next_step: intStep.nextStep,
          })
        })
      })
      if (materialData.length > 0) {
        await trx('PROGRAM_TEMPLATE_STEP').insert(materialData)
      }
    })
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
