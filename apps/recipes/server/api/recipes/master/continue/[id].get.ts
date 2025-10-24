import { dmsDB } from '~/server/connectionPool'
import type { RecipeProgramMaster } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const recipe: RecipeProgramMaster = await dmsDB('RECIPE_PROGRAM_MASTER').select({
    recipeId: 'recipe_id',
    recipeName: 'recipe_name',
    recipeGroup: 'recipe_group',
    recipeType: 'recipe_type',
    comment: 'recipe_comment',
    prepTime: 'prep_time',
    lastUpdate: 'last_update',
    stepNo: 'step_no',
    programNo: 'program_no',
    isPassive: 'is_passive'
  }).where('recipe_id', id).first()
  return recipe
})
