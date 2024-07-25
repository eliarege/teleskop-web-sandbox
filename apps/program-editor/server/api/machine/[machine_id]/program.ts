import { machineStore } from '~/server/classes/MachineStore'
import type { Program } from '~/shared/types'
import { ProgramStatus } from '~/shared/constants'
import { PError } from '~/server/error'

export default defineEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const machine = await machineStore.get(machineId)
  const query = getQuery(event)
  if (event.method === 'GET') {
    if (query?.asList) {
      return await machine.getProgramHeadersAsList()
    }

    const programs = await machine.fetchAllProgramHeaders(query)
    return programs
  } else if (event.method === 'POST') {
    const body = await readBody(event)
    const programNoToCheck = body.newProgramNo ?? body.programNo ?? body.program?.programNo

    let program: Program
    if (body.program) {
      program = body.program
    } else {
      const machineOfCopiedProgram = await machineStore.get(body.machineIdOfCopiedProgram)
      program = await machineOfCopiedProgram.fetchProgram(body.programNo)
      program.programState = ProgramStatus.EXISTS_ONLY_ON_DATABASE
      program.machineId = machineId
      program.programNo = programNoToCheck
    }

    try {
      return await machine.insertProgram(program)
    } catch (error) {
      if (error instanceof PError) {
        if (error.code === 'PROGRAM_EXISTS') {
          return 0
          // return createError({ statusCode: 409, data: { code: error.code, detail: error.detail } })
        }
      }
    }

    return 1
  } else if (event.method === 'PUT') {
    const body = await readBody(event)
    // const hasPrg = await machine.hasProgram(body.program.parogramNo)
    // if (hasPrg)
    //   return 0 // Program with spesified programNo has exist on machine
    // else {
    // }
    return machine.updateProgram(body.program)
  }
  return await machine.getProgramHeadersAsList()
})
