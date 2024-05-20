import { machineStore } from '~/server/classes/MachineStore'

export default defineEventHandler(async (event) => {
  const { machine_id, program_no } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const programNo = Number.parseInt(program_no)
  const machine = await machineStore.get(machineId)
  return await machine.fetchRemoteProgram(programNo)
})
