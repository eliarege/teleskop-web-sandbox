import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { recipeid } = getRouterParams(event)
  const templates = await dmsDB('JOB_ORDER_TEMPLATE_HEADER').select({
    recipeId: 'recipe_id',
    templateName: 'template_name',
  }).where('recipe_id', recipeid)
  return templates
})
