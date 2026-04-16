import { machineStore } from '~/server/classes/MachineStore'
import { PError } from '~/server/error'
import { useLogger } from '~/server/logger'
import type { ProgramHeader } from '~/shared/types'

export default defineAuthEventHandler({
  roles: ['program-edit'],
  handler: async (event) => {
    const log = useLogger(event)

    if (event.method === 'PUT') {
      const { machine_id } = getRouterParams(event)
      const machineId = Number.parseInt(machine_id)

      if (Number.isNaN(machineId)) {
        throw new PError('INVALID_MACHINE_NUMBER', { machineId })
      }

      const body = await readBody(event)
      const program: ProgramHeader = body.program
      if (!program) {
        throw new PError('PROGRAM_NOT_FOUND', { machineId, programNo: 0 })
      }

      const machine = await machineStore.get(machineId)
      if (!machine) {
        throw new PError('MACHINE_NOT_FOUND', { machineId })
      }

      program.isChanged = true

      log.info('Updating header of program %d on machine %d.', program.programNo, machineId)

      const result = await machine.updateProgramHeader(program)
      log.info('Header of program %d updated on machine %d.', program.programNo, machineId)
      return result
    }

    if (event.method === 'GET') {
      const { machine_id, program_no } = getRouterParams(event)
      const machineId = Number.parseInt(machine_id)
      const programNo = Number.parseInt(program_no)
      const machine = await machineStore.get(machineId)

      return await machine.fetchProgramHeader(machineId, programNo)
    }
  },
})
