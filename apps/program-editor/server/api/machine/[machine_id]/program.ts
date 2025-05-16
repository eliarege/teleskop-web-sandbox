import { machineStore } from '~/server/classes/MachineStore'
import type { Program } from '~/shared/types'
import { ProgramStatus } from '~/shared/constants'
import { PError } from '~/server/error'
import { ProgramEditorActivityCodes } from '~/server/constants'
import { logEditorOperation } from '~/server/functions'
import logger from '~/server/logger'
import { checkPermission } from '~/server/utils/auth'

export default defineAuthEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const machine = await machineStore.get(machineId)
  const query = getQuery(event)

  if (event.method === 'GET') {
    return handleGetPrograms(machine, query)
  }

  if (event.method === 'POST') {
    checkPermission(event, 'program-create')
    const body = await readBody(event)
    return handleCreateProgram(machine, body, machineId, event.context?.kauth?.name)
  }

  if (event.method === 'PUT') {
    checkPermission(event, 'program-edit')
    const body = await readBody(event)
    return handleUpdateProgram(machine, body, machineId, event.context?.kauth?.name)
  }

  throw createError({ statusCode: 405, statusMessage: `Method ${event.method} not allowed.` })
})

// Helper Functions

async function handleGetPrograms(machine: any, query: any) {
  if (query?.asList) {
    return await machine.getProgramHeadersAsList()
  }
  return await machine.fetchAllProgramHeaders(query)
}
async function handleCreateProgram(
  machine: any,
  body: any,
  machineId: number,
  userName?: string,
) {
  const programNoToCheck = body.newProgramNo ?? body.programNo ?? body.program?.programNo

  let program: Program
  let actCode: string
  let act1: string
  let act2: string

  try {
    if (body.program) {
      // Yeni program oluşturuluyor
      program = body.program
      program.programNo = programNoToCheck
      program.machineId = machineId

      actCode = ProgramEditorActivityCodes.PROGRAMCREATED
      act1 = `Machine ${machineId}`
      act2 = program.programNo
    } else {
      // Var olan program kopyalanıyor
      const sourceMachineId = body.machineIdOfCopiedProgram
      const sourceProgramNo = body.programNo

      if (!sourceMachineId || !sourceProgramNo) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid source program',
          data: {
            code: 'INVALID_PROGRAM',
            detail: 'Invalid source program',
          },
        })
      }

      const sourceMachine = await machineStore.get(sourceMachineId)
      const result = await sourceMachine.fetchProgram(sourceProgramNo)

      program = result.program
      program.programState = ProgramStatus.EXISTS_ONLY_ON_DATABASE
      program.machineId = machineId
      program.programNo = programNoToCheck

      actCode = ProgramEditorActivityCodes.PROGRAMCOPIED
      act1 = `Source Machine/Program ${sourceMachineId},${sourceProgramNo}`
      act2 = `Target Machine/Program ${machineId},${program.programNo}`
    }

    // Loglama ve kaydetme işlemleri
    logger.info(`User: ${userName}. Created program ${program.programNo} on machine ${machineId}.`)
    await machine.insertProgram(program)
    await logEditorOperation(actCode, act1, act2)

    return { success: true }
  } catch (err) {
    logger.error(`Error creating program on machine ${machineId}: ${err.message}`)
    handleProgramError(err)
    return { success: false, error: err.message }
  }
}

async function handleUpdateProgram(machine: any, body: any, machineId: number, userName?: string) {
  try {
    logger.info(`User: ${userName}. Updated program ${body.program.programNo} of machine ${machineId}.`)
    return await machine.updateProgram(body.program)
  } catch (err) {
    handleProgramError(err)
  }
}

function handleProgramError(err: unknown) {
  if (err instanceof PError) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid program',
      data: {
        code: err.code,
        detail: err.detail,
      },
    })
  }
  throw err
}
