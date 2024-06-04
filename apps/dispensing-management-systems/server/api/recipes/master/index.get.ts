import { dmsDB } from '~/server/connectionPool'
import type { RecipeMaster } from '~/shared/types'

export default defineEventHandler(async () => {
  const recipes: Array<RecipeMaster> = await dmsDB('RECIPE_MASTER').select({
    recipeId: 'recipe_id',
    recipeName: 'recipe_name',
  })
  return recipes
})
