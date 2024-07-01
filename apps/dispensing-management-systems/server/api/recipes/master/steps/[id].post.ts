import { dmsDB } from '~/server/connectionPool'
import type { RecipeMasterStep } from "~/shared/types"

export default defineEventHandler(async (event) => {
  const { steps } = await readBody<{steps: RecipeMasterStep[]}>(event)
  const { id } = getRouterParams(event)
  try {
    await dmsDB('RECIPE_MASTER_STEP').where('recipe_master_id', id).del()

    const insertData = steps.map(step => ({
      recipe_master_id: id,
      material_code: step.materialCode,
      main_step: step.mainStep,
      parallel_step: step.parallelStep,
      amount: step.amount,
      unit: step.unit
    }))

    const res = await dmsDB('RECIPE_MASTER_STEP').insert(insertData)

    return res
  } catch (e) {
    console.error(e)
    const error = {
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    }
    return sendError(event, createError(error))
  }
})
