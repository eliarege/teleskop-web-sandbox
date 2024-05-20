import { MachineController } from '~/server/classes/MachineController'

export default defineEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const machine = await MachineController.create(machineId)
  const machineInfo = await machine.getMachineInfo()
  return machineInfo
})
