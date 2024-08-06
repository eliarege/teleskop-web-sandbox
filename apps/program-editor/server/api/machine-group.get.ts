import { groupMachinesByGroup } from '../functions'

export default defineAuthEventHandler(async () => {
  return await groupMachinesByGroup()
})
