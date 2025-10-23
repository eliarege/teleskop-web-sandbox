import { machineStore } from '~/server/classes/MachineStore'
import { PError, isPError } from '~/server/error'
import logger from '~/server/logger'
import { checkPermission } from '~/server/utils/auth'

export default defineAuthEventHandler({
  roles: ['program-view'],
  handler: async (event) => {
    try {
      const { machine_id, program_no, version } = getRouterParams(event)
      const machineId = Number.parseInt(machine_id)
      const programNo = Number.parseInt(program_no)
      const versionNo = Number.parseInt(version)

      if (!Number.isInteger(machineId)) {
        throw new PError('INVALID_MACHINE_NUMBER', { machineId })
      }

      if (!Number.isInteger(programNo)) {
        throw new PError('INVALID_PROGRAM_NUMBER', { programNo })
      }

      if (!Number.isInteger(versionNo) || versionNo < 1) {
        throw new PError('INVALID_VERSION_NUMBER', { versionNo })
      }

      const machine = await machineStore.get(machineId)

      if (!machine) {
        throw new PError('MACHINE_NOT_FOUND', { machineId })
      }

      if (event.method === 'GET') {
        logger.info(`User: ${event.context.kauth?.name}. Fetching archived program ${programNo} of machine ${machineId}.`)
        return await machine.fetchArchivedProgram(programNo, versionNo)
      }

      if (event.method === 'PUT') {
        checkPermission(event, 'program-edit')
        const { isNewVersion, isOperatorEditable } = await readBody<{ isNewVersion: boolean, isOperatorEditable: boolean }>(event)
        const newVersion = await machine.fetchArchivedProgram(programNo, versionNo)

        if (!newVersion) {
          throw new PError('PROGRAM_VERSION_NOT_FOUND', { programNo, versionNo })
        }

        newVersion.tbbProgramChangedEvent = isOperatorEditable ? 1 : 0

        await machine.withTransaction(async () => {
          await machine.deleteProgramFromDatabase(programNo)
          await machine.insertProgram(newVersion, isNewVersion)
        })

        logger.info(`User: ${event.context.kauth?.name}. Archived program ${programNo} updated for machine ${machineId}.`)
        return { status: 'success', message: 'Program updated successfully' }
      }

      if (event.method === 'DELETE') {
        checkPermission(event, 'program-delete')
        logger.info(`User: ${event.context.kauth?.name}. Deleting archived program ${programNo} version ${versionNo} of machine ${machineId}.`)
        await machine.deleteVersions(programNo, [versionNo])
        return { success: true }
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
