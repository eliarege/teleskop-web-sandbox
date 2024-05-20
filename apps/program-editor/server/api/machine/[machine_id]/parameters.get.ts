import { getMachineBatchParameters } from '~/server/functions'

export default defineEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  return await getMachineBatchParameters(Number(machine_id))
})
