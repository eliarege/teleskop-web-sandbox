import { machineStore } from '~/server/classes/MachineStore'
import logger from '~/server/logger'

export default defineAuthEventHandler({
  roles: ['program-view'],
  handler: async (event) => {
    const { machine_id, program_no } = getRouterParams(event)
    const machineId = Number.parseInt(machine_id)
    const programNo = Number.parseInt(program_no)
    const machine = await machineStore.get(machineId)
    logger.info(`User: ${event.context.kauth?.name}. Fetching archived program versions of program ${programNo} of machine ${machineId}.`)

    return await machine.fetchAllHeadersOfArchivedProgram(programNo)
  },
})
