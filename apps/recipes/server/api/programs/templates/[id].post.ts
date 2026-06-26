import { dmsDB } from '~/server/connectionPool'
import { RecipeType } from '~/shared/constants'
import type { RecipeMasterStep, RecipeStep } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { template, machineId } = await readBody<{ template: RecipeMasterStep, machineId: number }>(event)
  const { id } = getRouterParams(event)
  try {
    await dmsDB.transaction(async (trx) => {
      // Deleting steps cascades to PROGRAM_TEMPLATE_STEP_MATERIAL via fk_step_id.
      await trx('PROGRAM_TEMPLATE_STEP').where('program_no', id).andWhere('machine_id', machineId).del()

      const regularStepGroups: { steps: RecipeStep[], type: number }[] = [
        { steps: template.chemSteps ?? [], type: RecipeType.CHEM },
        { steps: template.dyeSteps ?? [], type: RecipeType.DYE },
        { steps: template.saltSteps ?? [], type: RecipeType.SALT },
      ]

      for (const { steps, type } of regularStepGroups) {
        for (const step of steps) {
          // Insert one step row regardless of whether it has materials,
          // so steps (orderNo) without materials are persisted.
          const [inserted] = await trx('PROGRAM_TEMPLATE_STEP')
            .insert({
              program_no: id,
              machine_id: machineId,
              type,
              step_no: step.orderNo,
              next_step: step.materials.find(m => m.nextStep != null)?.nextStep ?? null,
            })
            .returning('id')

          const materialData = step.materials.map(material => ({
            step_id: inserted.id,
            material_code: material.materialCode,
            unit: material.unit,
            amount: material.amount,
          }))
          if (materialData.length > 0) {
            await trx('PROGRAM_TEMPLATE_STEP_MATERIAL').insert(materialData)
          }
        }
      }

      // Handle manual steps (step_no = -1): one step row per manual step.
      for (const intStep of template.manualSteps ?? []) {
        const [inserted] = await trx('PROGRAM_TEMPLATE_STEP')
          .insert({
            program_no: id,
            machine_id: machineId,
            type: intStep.type,
            step_no: -1,
            next_step: intStep.nextStep,
          })
          .returning('id')

        const materialData = intStep.materials.map(material => ({
          step_id: inserted.id,
          material_code: material.materialCode,
          unit: material.unit,
          amount: material.amount,
        }))
        if (materialData.length > 0) {
          await trx('PROGRAM_TEMPLATE_STEP_MATERIAL').insert(materialData)
        }
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
