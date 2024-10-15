import { dmsDB } from '~/server/connectionPool'
import type { RecipeMaster } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { recipe } = await readBody<{ recipe: RecipeMaster }>(event)
  const res = await dmsDB('RECIPE_MASTER').insert({
    recipe_id: recipe.recipeId,
    recipe_name: recipe.recipeName
  })
  return res
})
