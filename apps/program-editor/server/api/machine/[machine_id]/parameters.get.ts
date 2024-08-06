import { getMachineBatchParameters } from '~/server/functions'

export default defineAuthEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  return await getMachineBatchParameters(Number(machine_id))
})
