import { machineStore } from '~/server/classes/MachineStore'
import { PError, isPError } from '~/server/error'
import logger from '~/server/logger'
import { checkPermission } from '~/server/utils/auth'

export default defineAuthEventHandler({
  roles: ['program-view'],
  handler: async (event) => {
    try {
      const { machine_id, program_no } = getRouterParams(event)
      const machineId = Number.parseInt(machine_id)
      const programNo = Number.parseInt(program_no)

      if (!Number.isInteger(machineId)) {
        throw new PError('INVALID_MACHINE_NUMBER', { machineId })
      }

      if (!Number.isInteger(programNo)) {
        throw new PError('INVALID_PROGRAM_NUMBER', { programNo })
      }

      const machine = await machineStore.get(machineId)
      if (!machine) {
        throw new PError('MACHINE_NOT_FOUND', { machineId })
      }

      if (event.method === 'GET') {
        logger.info(`User: ${event.context.kauth?.name}. Fetching archived program versions of program ${programNo} of machine ${machineId}.`)
        return await machine.fetchAllHeadersOfArchivedProgram(programNo)
      }

      if (event.method === 'DELETE') {
        checkPermission(event, 'program-delete')
        const { versions } = await readBody<{ versions: number[] }>(event)

        if (!Array.isArray(versions) || versions.length === 0) {
          throw new PError('INVALID_VERSION_LIST', { versions })
        }

        const deletedCount = await machine.deleteVersions(programNo, versions)
        logger.info(`User: ${event.context.kauth?.name}. Deleted ${deletedCount} versions of program ${programNo} from machine ${machineId}.`)

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
