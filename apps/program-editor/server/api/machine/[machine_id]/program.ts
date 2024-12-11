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

async function handleCreateProgram(machine: any, body: any, machineId: number, userName?: string) {
  const programNoToCheck = body.newProgramNo ?? body.programNo ?? body.program?.programNo
  let program: Program
  let actCode, act1, act2

  if (body.program) {
    program = body.program
    actCode = ProgramEditorActivityCodes.PROGRAMCREATED
    act1 = `Machine ${machineId}`
    act2 = program.programNo
  } else {
    const machineOfCopiedProgram = await machineStore.get(body.machineIdOfCopiedProgram)
    program = await machineOfCopiedProgram.fetchProgram(body.programNo)
    program.programState = ProgramStatus.EXISTS_ONLY_ON_DATABASE
    program.machineId = machineId
    program.programNo = programNoToCheck
    actCode = ProgramEditorActivityCodes.PROGRAMCOPIED
    act1 = `Source Machine/Program ${body.machineIdOfCopiedProgram},${body.programNo}`
    act2 = `Target Machine/Program ${machineId},${program.programNo}`
  }

  try {
    logger.info(`User: ${userName}. Created program ${program.programNo} of machine ${machineId}.`)
    await machine.insertProgram(program)
    await logEditorOperation(actCode, act1, act2)
  } catch (err) {
    handleProgramError(err)
  }

  return 1
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
