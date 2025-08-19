import { machineStore } from '~/server/classes/MachineStore'
import { PError } from '~/server/error'

export default defineAuthEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const machineId = Number(machine_id)

  if (!Number.isInteger(machineId)) {
    throw new PError('INVALID_MACHINE_OR_PROGRAM_NUMBER', { machineId, programNo: 0 })
  }

  const machine = await machineStore.get(machineId)
  if (!machine) {
    throw new PError('MACHINE_NOT_FOUND', { machineId })
  }

  const machineProgramList = await machine.fetchRemoteProgramList() || []
  const teleskopProgramList = (await machine.fetchAllProgramHeaders()).map(program => program.programNo) || []

  for (const machineProgramNo of machineProgramList) {
    if (!teleskopProgramList.includes(machineProgramNo)) {
      await machine.insertEmptyProgramHeader(machineId, machineProgramNo)
    }
  }

  return true
})
