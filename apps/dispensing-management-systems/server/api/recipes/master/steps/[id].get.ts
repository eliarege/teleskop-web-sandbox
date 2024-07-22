import { dmsDB } from '~/server/connectionPool'
import type { RecipeMasterStep } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const recipeSteps: Array<RecipeMasterStep> = await dmsDB('RECIPE_MASTER_STEP as s').select({
    recipeId: 's.recipe_master_id',
    materialCode: 's.material_code',
    materialName: 'm.material_name',
    mainStep: 's.main_step',
    parallelStep: 's.parallel_step',
    amount: 's.amount',
    unit: 's.unit',
  }).where('s.recipe_master_id', id)
    .leftJoin('MATERIAL as m', 'm.material_code', 's.material_code')
    .orderBy(['s.main_step', 's.parallel_step'])
  return recipeSteps
})
