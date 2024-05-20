import { machineStore } from '~/server/classes/MachineStore'

export default defineEventHandler(async (event) => {
  const { machine_id, program_no, version } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const programNo = Number.parseInt(program_no)
  const versionNo = Number.parseInt(version)
  const machine = await machineStore.get(machineId)

  if (event.method === 'GET') {
    return await machine.fetchArchivedProgram(programNo, versionNo)
  } else if (event.method === 'DELETE') {
    return await machine.deleteVersion(programNo, versionNo)
  }
})
