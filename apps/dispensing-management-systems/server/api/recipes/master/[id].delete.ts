import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  await dmsDB('RECIPE_MASTER_STEP').delete().where('recipe_master_id', id)
  const res = await dmsDB('RECIPE_MASTER').delete().where('recipe_id', id)
  return res
})
