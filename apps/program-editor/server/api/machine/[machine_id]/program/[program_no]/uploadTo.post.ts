import { machineStore } from '~/server/classes/MachineStore'
import logger from '~/server/logger'

export default defineAuthEventHandler(async (event) => {
  const { machine_id, program_no } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const programNo = Number.parseInt(program_no)
  const body = await readBody(event)
  const machineOfProgram = await machineStore.get(machineId)
  const machineToUpload = await machineStore.get(body.machineId)
  const program = await machineOfProgram.fetchProgram(programNo)
  logger.info(`User: ${event.context.kauth?.name}. Uploading program ${programNo} of machine ${machineId} to machine ${body.machineId}.`)

  return await machineToUpload.uploadProgram(program)
})
