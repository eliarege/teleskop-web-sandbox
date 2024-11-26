import { machineStore } from '~/server/classes/MachineStore'
import logger from '~/server/logger'
import { hasRole } from '~/shared/utils' // Assuming hasRole is imported from utils

export default defineAuthEventHandler(async (event) => {
  const { machine_id, program_no, version } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const programNo = Number.parseInt(program_no)
  const versionNo = Number.parseInt(version)
  const machine = await machineStore.get(machineId)

  const userName = event.context.kauth?.name // Assuming the username is available from the context

  if (event.method === 'GET') {
    logger.info(`User: ${userName}. Fetching archived program ${programNo} of machine ${machineId}.`)
    return await machine.fetchArchivedProgram(programNo, versionNo)
  }

  if (event.method === 'POST') {
    // Role check for POST method (program update)
    if (!hasRole(event, 'program-edit')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to edit programs.',
      })
    }

    const newVersion = await machine.fetchArchivedProgram(programNo, versionNo)

    await machine.withTransaction(async () => {
      await machine.deleteProgramFromDatabase(programNo)
      await machine.insertProgram(newVersion)
    })

    logger.info(`User: ${userName}. Archived program ${programNo} updated for machine ${machineId}.`)
    return { status: 'success', message: 'Program updated successfully' }
  }

  if (event.method === 'DELETE') {
    // Role check for DELETE method (program delete)
    if (!hasRole(event, 'program-delete')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to delete programs.',
      })
    }

    logger.info(`User: ${userName}. Deleting archived program ${programNo} of machine ${machineId}.`)
    return await machine.deleteVersion(programNo, versionNo)
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: `Method ${event.method} not allowed.`,
  })
})
