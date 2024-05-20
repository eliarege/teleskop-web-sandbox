import { machineStore } from '~/server/classes/MachineStore'
import { type ErrorProgramDetail, PError } from '~/server/error'

export default defineEventHandler(async (event) => {
  const { machine_id, program_no } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const programNo = Number.parseInt(program_no)
  const machine = await machineStore.get(machineId)

  if (event.method === 'GET') {
    const program = await machine.fetchProgram(programNo)
    return program
  } else if (event.method === 'DELETE') {
    const body = await readBody(event)
    if ([1, 2].includes(body.selectedOption))
      return await machine.deleteProgramFromDatabase(programNo)
    if ([1, 3].includes(body.selectedOption))
      return await machine.deleteRemoteProgram(programNo)
    return 0
  }
  if (!await machine.hasProgram(programNo)) {
    const errorDetail: ErrorProgramDetail = { machineId, programNo }
    throw new PError('PROGRAM_NOT_FOUND', errorDetail)
  }
})
