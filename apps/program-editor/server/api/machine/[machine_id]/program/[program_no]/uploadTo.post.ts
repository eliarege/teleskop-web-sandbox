import { machineStore } from '~/server/classes/MachineStore'
import { PError } from '~/server/error'
import logger from '~/server/logger'

export default defineAuthEventHandler({
  roles: ['machine-upload'],
  handler: async (event) => {
    const { machine_id, program_no } = getRouterParams(event)
    const machineId = Number(machine_id)
    const programNo = Number(program_no)

    if (!Number.isInteger(machineId) || !Number.isInteger(programNo)) {
      throw new PError('INVALID_MACHINE_OR_PROGRAM_NUMBER', { machineId, programNo })
    }

    const body = await readBody(event)
    const machineOfProgram = await machineStore.get(machineId)
    if (!machineOfProgram) {
      throw new PError('MACHINE_NOT_FOUND', { machineId })
    }

    const machineToUpload = await machineStore.get(body.machineId)
    if (!machineToUpload) {
      throw new PError('MACHINE_NOT_FOUND', { machineId })
    }

    const { program } = await machineOfProgram.fetchProgram(programNo)
    logger.info(`User: ${event.context.kauth?.name}. Uploading program ${programNo} of machine ${machineId} to machine ${body.machineId}.`)

    return await machineToUpload.uploadProgram(program)
  },
})
