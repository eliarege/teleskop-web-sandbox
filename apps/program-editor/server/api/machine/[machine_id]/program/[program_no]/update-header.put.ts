import { machineStore } from '~/server/classes/MachineStore'
import logger from '~/server/logger'
import type { ProgramHeader } from '~/shared/types'

export default defineAuthEventHandler({
  roles: ['program-edit'],
  handler: async (event) => {
    const { machine_id } = getRouterParams(event)
    const machineId = Number.parseInt(machine_id)
    const body = await readBody(event)
    const program: ProgramHeader = body.program
    const machine = await machineStore.get(machineId)

    logger.info(`User: ${event.context.kauth?.name}. Updating name of program ${program.programNo} of machine ${machineId}.`)
    return await machine.updateProgramHeader(program)
  },
})
