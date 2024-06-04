import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { recipeId } = getRouterParams(event)
  const res = await dmsDB('RECIPE_MASTER').delete().where('recipe_id', recipeId)
  return res
})
