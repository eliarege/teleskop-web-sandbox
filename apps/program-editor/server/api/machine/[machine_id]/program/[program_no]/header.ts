import { machineStore } from '~/server/classes/MachineStore'
import logger from '~/server/logger'
import type { ProgramHeader } from '~/shared/types'

export default defineAuthEventHandler({
  roles: ['program-edit'],
  handler: async (event) => {
    if (event.method === 'PUT') {
      const { machine_id } = getRouterParams(event)
      const machineId = Number.parseInt(machine_id)
      const body = await readBody(event)
      const program: ProgramHeader = body.program
      const machine = await machineStore.get(machineId)

      logger.info(`User: ${event.context.kauth?.name}. Updating name of program ${program.programNo} of machine ${machineId}.`)
      return await machine.updateProgramHeader(program)
    }

    if (event.method === 'GET') {
      const { machine_id, program_no } = getRouterParams(event)
      const machineId = Number.parseInt(machine_id)
      const programNo = Number.parseInt(program_no)
      const machine = await machineStore.get(machineId)
      logger.info(`User: ${event.context.kauth?.name}. Fetching header of program ${programNo} of machine ${machineId}.`)

      return await machine.fetchProgramHeader(machineId, programNo)
    }
  },
})
