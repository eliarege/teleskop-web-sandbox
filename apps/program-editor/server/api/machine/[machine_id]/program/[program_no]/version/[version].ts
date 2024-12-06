import { machineStore } from '~/server/classes/MachineStore'
import logger from '~/server/logger'
import { checkPermission } from '~/server/utils/auth'

export default defineAuthEventHandler(async (event) => {
  const { machine_id, program_no, version } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const programNo = Number.parseInt(program_no)
  const versionNo = Number.parseInt(version)
  const machine = await machineStore.get(machineId)

  const userName = event.context.kauth?.name

  if (event.method === 'GET') {
    logger.info(`User: ${userName}. Fetching archived program ${programNo} of machine ${machineId}.`)
    return await machine.fetchArchivedProgram(programNo, versionNo)
  }

  if (event.method === 'POST') {
    checkPermission(event, 'program-edit')
    const newVersion = await machine.fetchArchivedProgram(programNo, versionNo)

    await machine.withTransaction(async () => {
      await machine.deleteProgramFromDatabase(programNo)
      await machine.insertProgram(newVersion)
    })

    logger.info(`User: ${userName}. Archived program ${programNo} updated for machine ${machineId}.`)
    return { status: 'success', message: 'Program updated successfully' }
  }

  if (event.method === 'DELETE') {
    checkPermission(event, 'program-delete')
    logger.info(`User: ${userName}. Deleting archived program ${programNo} of machine ${machineId}.`)
    return await machine.deleteVersion(programNo, versionNo)
  }

  throw createError({
    statusCode: 405,
    statusMessage: `Method ${event.method} not allowed.`,
  })
})
