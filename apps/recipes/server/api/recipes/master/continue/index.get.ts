import { dmsDB } from '~/server/connectionPool'
import type { RecipeProgramMaster } from '~/shared/types'

export default defineEventHandler(async () => {
  const recipes: Array<RecipeProgramMaster> = await dmsDB('RECIPE_PROGRAM_MASTER').select({
    recipeId: 'recipe_id',
    recipeName: 'recipe_name',
    programNo: 'program_no'
  }).orderBy('recipe_id')
  return recipes
})
