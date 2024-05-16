import { dmsDB } from '~/server/connectionPool'
import type { RecipeMaster } from '~/shared/types'

export default defineEventHandler(async () => {
  const recipes: Array<RecipeMaster> = await dmsDB('RECIPE_MASTER').select({
    recipeId: 'recipe_id',
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
  })
  return recipes
})
