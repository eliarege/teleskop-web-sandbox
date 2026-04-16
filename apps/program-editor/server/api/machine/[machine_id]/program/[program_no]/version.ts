import { machineStore } from '~/server/classes/MachineStore'
import { PError, isPError } from '~/server/error'
import { useLogger } from '~/server/logger'
import { checkPermission } from '~/server/utils/auth'

export default defineAuthEventHandler({
  roles: ['program-view'],
  handler: async (event) => {
    const log = useLogger(event)
    try {
      const { machine_id, program_no } = getRouterParams(event)
      const machineId = Number.parseInt(machine_id)
      const programNo = Number.parseInt(program_no)

      if (!Number.isInteger(machineId)) {
        throw new PError('INVALID_MACHINE_NUMBER', { machineId })
      }

      if (!Number.isInteger(programNo)) {
        throw new PError('INVALID_PROGRAM_NUMBER', { machineId, programNo })
      }

      const machine = await machineStore.get(machineId)
      if (!machine) {
        throw new PError('MACHINE_NOT_FOUND', { machineId })
      }

      if (event.method === 'GET') {
        return await machine.fetchAllHeadersOfArchivedProgram(programNo)
      }

      if (event.method === 'DELETE') {
        checkPermission(event, 'program-delete')
        const { versions } = await readBody<{ versions: number[] }>(event)

        if (!Array.isArray(versions) || versions.length === 0) {
          throw new PError('INVALID_VERSION_LIST', { versions })
        }

        log.info('Deleting %d versions of program %d from machine %d.', versions.length, programNo, machineId)
        const deletedCount = await machine.deleteVersions(programNo, versions)
        log.info('Deleted %d versions of program %d from machine %d.', deletedCount, programNo, machineId)

        return versions
      }
    } catch (error: PError | unknown) {
      if (isPError(error)) {
        throw createError({
          statusCode: 400,
          message: error.code,
          data: error.detail,
        })
      }

      throw createError({
        statusCode: 500,
        message: 'INTERNAL_SERVER_ERROR',
      })
    }
  },
})
