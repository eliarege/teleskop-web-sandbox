import { machineStore } from '~/server/classes/MachineStore'

export default defineAuthEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const machine = await machineStore.get(machineId)
  return await machine.fetchMachineConstants()
})
