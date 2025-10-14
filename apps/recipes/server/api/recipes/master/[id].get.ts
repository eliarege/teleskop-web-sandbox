import { dmsDB } from '~/server/connectionPool'
import type { RecipeProgramMaster } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { machineId } = getQuery(event)
  const recipe: RecipeProgramMaster = await dmsDB('RECIPE_MASTER').select({
    recipeId: 'recipe_id',
    recipeName: 'recipe_name',
    recipeGroup: 'recipe_group',
    recipeType: 'recipe_type',
    machineId: 'machine_id',
    comment: 'recipe_comment',
    prepTime: 'prep_time',
    lastUpdate: 'last_update',
    colorCode: 'color_code',
    colorName: 'color_name',
    isPassive: 'is_passive'
  }).where('recipe_id', id).andWhere('machine_id', machineId).first()
  return recipe
})
