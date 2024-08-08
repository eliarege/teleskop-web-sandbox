import { machineStore } from '~/server/classes/MachineStore'
import type { Program } from '~/shared/types'
import { ProgramStatus } from '~/shared/constants'
import { PError } from '~/server/error'
import { ProgramEditorActivityCodes } from '~/server/constants'
import { logEditorOperation } from '~/server/functions'

export default defineAuthEventHandler(async (event) => {
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
    let actCode, act1, act2
    if (body.program) {
      program = body.program
      actCode = ProgramEditorActivityCodes.PROGRAMCREATED
      act1 = `Makine ${machineId}`
      act2 = program.programNo
    } else {
      const machineOfCopiedProgram = await machineStore.get(body.machineIdOfCopiedProgram)
      program = await machineOfCopiedProgram.fetchProgram(body.programNo)
      program.programState = ProgramStatus.EXISTS_ONLY_ON_DATABASE
      program.machineId = machineId
      program.programNo = programNoToCheck
      actCode = ProgramEditorActivityCodes.PROGRAMCOPIED
      act1 = `Kaynak Makine/Program ${body.machineIdOfCopiedProgram},${body.programNo}`
      act2 = `Hedef Makine/Program ${machineId},${program.programNo}`
    }

    try {
      await machine.insertProgram(program)
      await logEditorOperation(actCode, act1, act2)
    } catch (err) {
      if (err instanceof PError) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid program',
          data: {
            code: err.code,
            detail: err.detail,
          },
        })
      } else {
        throw err
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
    try {
      return await machine.updateProgram(body.program)
    } catch (err) {
      if (err instanceof PError) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid program',
          data: {
            code: err.code,
            detail: err.detail,
          },
        })
      } else {
        throw err
      }
    }
  }
  return await machine.getProgramHeadersAsList()
})
