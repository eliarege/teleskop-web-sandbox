import { groupMachinesByGroup } from '../functions'

export default defineEventHandler(async () => {
  return await groupMachinesByGroup()
})
