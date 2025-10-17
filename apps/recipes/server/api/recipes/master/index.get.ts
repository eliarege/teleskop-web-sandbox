import { dmsDB } from '~/server/connectionPool'
import type { RecipeProgramMaster } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  let query = dmsDB('RECIPE_MASTER').select({
    recipeId: 'recipe_id',
    recipeName: 'recipe_name',
    machineId: 'machine_id',
    colorCode: 'color_code',
    colorName: 'color_name',
    lastUpdate: 'last_update',
    prepTime: 'prep_time'
  })

  if (machineId) {
    query = query.where('machine_id', machineId)
  }

  const recipes: Array<RecipeProgramMaster> = await query.orderBy('recipe_id')
  return recipes
})
