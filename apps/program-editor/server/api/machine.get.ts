import { getMachines } from '~/server/functions'

export default defineAuthEventHandler(async () => {
  return await getMachines()
})
