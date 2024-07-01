import { dmsDB } from '~/server/connectionPool'
import type { RecipeMaster } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const recipe: RecipeMaster = await dmsDB('RECIPE_MASTER').select({
    recipeName: 'recipe_name',
    recipeGroup: 'recipe_group',
    recipeType: 'recipe_type',
    comment: 'recipe_comment',
    prepTime: 'prep_time',
    lastUpdate: 'last_update',
    stepNo: 'step_no',
    programNo: 'program_no',
    machineId: 'machine_id',
    isPassive: 'is_passive'
  }).where('recipe_id', id).first()
  return recipe
})
