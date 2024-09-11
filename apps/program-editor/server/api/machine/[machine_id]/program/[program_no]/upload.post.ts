import { machineStore } from '~/server/classes/MachineStore'
import logger from '~/shared/logger'

export default defineAuthEventHandler(async (event) => {
  const { machine_id, program_no } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const programNo = Number.parseInt(program_no)

  const machine = await machineStore.get(machineId)
  const program = await machine.fetchProgram(programNo)
  logger.info(`User: ${event.context.kauth?.name}. Uploading program ${programNo} of machine ${machineId}.`)

  return await machine.uploadProgram(program)
})
