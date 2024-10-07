import { machineStore } from '~/server/classes/MachineStore'
import logger from '~/server/logger'

export default defineAuthEventHandler(async (event) => {
  const { machine_id, program_no, version } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const programNo = Number.parseInt(program_no)
  const versionNo = Number.parseInt(version)
  const machine = await machineStore.get(machineId)

  if (event.method === 'GET') {
    logger.info(`User: ${event.context.kauth?.name}. Fetching archived program ${programNo} of machine ${machineId}.`)
    return await machine.fetchArchivedProgram(programNo, versionNo)
  } else if (event.method === 'POST') {
    const newVersion = await machine.fetchArchivedProgram(programNo, versionNo)

    await machine.withTransaction(async () => {
      await machine.deleteProgramFromDatabase(programNo)
      await machine.insertProgram(newVersion)
    })
  } else if (event.method === 'DELETE') {
    logger.info(`User: ${event.context.kauth?.name}. Deleting archived program ${programNo} of machine ${machineId}.`)
    return await machine.deleteVersion(programNo, versionNo)
  }
})
