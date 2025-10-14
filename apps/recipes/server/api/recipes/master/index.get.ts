import { dmsDB } from '~/server/connectionPool'
import type { RecipeProgramMaster } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const recipes: Array<RecipeProgramMaster> = await dmsDB('RECIPE_MASTER').select({
    recipeId: 'recipe_id',
    recipeName: 'recipe_name',
    machineId: 'machine_id',
    colorCode: 'color_code',
    colorName: 'color_name',
    lastUpdate: 'last_update',
    prepTime: 'prep_time'
  }).where('machine_id', machineId).orderBy('recipe_id')
  return recipes
})
