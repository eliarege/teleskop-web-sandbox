import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const res = await dmsDB('RECIPE_MASTER').delete().where('recipe_id', id)
  return res
})
