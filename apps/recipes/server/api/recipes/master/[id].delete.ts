import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { machineId } = getQuery(event)
  await dmsDB('RECIPE_MASTER_STEP').delete().where('recipe_id', id).andWhere('machine_id', machineId)
  await dmsDB('RECIPE_MASTER_MATERIAL').delete().where('recipe_id', id).andWhere('machine_id', machineId)
  const res = await dmsDB('RECIPE_MASTER').delete().where('recipe_id', id).andWhere('machine_id', machineId)
  return res
})
