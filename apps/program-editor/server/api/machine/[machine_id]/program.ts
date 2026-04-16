import type { Logger } from 'pino'
import { machineStore } from '~/server/classes/MachineStore'
import type { Program, ProgramTableRow } from '~/shared/types'
import { ProgramStatus } from '~/shared/constants'
import { PError } from '~/server/error'
import { ProgramEditorActivityCodes } from '~/server/constants'
import { calculateProgramStatus, logEditorOperation } from '~/server/functions'
import { useLogger } from '~/server/logger'
import { checkPermission } from '~/server/utils/auth'
import type { MachineController } from '~/server/classes/MachineController'

export default defineAuthEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const machineId = Number(machine_id)
  if (!Number.isInteger(machineId)) {
    throw new PError('INVALID_MACHINE_NUMBER', { machineId })
  }

  const machine = await machineStore.get(machineId)
  if (!machine) {
    throw new PError('MACHINE_NOT_FOUND', { machineId })
  }

  const query = getQuery(event)

  if (event.method === 'GET') {
    const programs = await machine.fetchAllProgramHeaders(query)

    return programs.map((program: ProgramTableRow) => ({
      ...program,
      prgState: calculateProgramStatus(program),
    }))
  }

  if (event.method === 'POST') {
    checkPermission(event, 'program-create')
    const body = await readBody(event)
    const log = useLogger(event)
    return handleCreateProgram(machine, body, machineId, log)
  }

  if (event.method === 'PUT') {
    checkPermission(event, 'program-edit')
    const body = await readBody(event)
    const log = useLogger(event)
    return handleUpdateProgram(machine, body, machineId, log)
  }

  throw createError({ statusCode: 405, statusMessage: `Method ${event.method} not allowed.` })
})

// Helper Functions
async function handleCreateProgram(
  machine: MachineController,
  body: any,
  machineId: number,
  log: Logger,
): Promise<{ success: boolean, error?: string }> {
  const programNoToCheck = body.newProgramNo ?? body.programNo ?? body.program?.programNo

  let program: Program
  let actCode: number
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
      act2 = program.programNo.toString()
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
      program.prgState = ProgramStatus.EXISTS_ONLY_ON_DATABASE
      program.machineId = machineId
      program.programNo = programNoToCheck

      actCode = ProgramEditorActivityCodes.PROGRAMCOPIED
      act1 = `Source Machine/Program ${sourceMachineId},${sourceProgramNo}`
      act2 = `Target Machine/Program ${machineId},${program.programNo}`
    }

    // Loglama ve kaydetme işlemleri
    log.info('Created program %d on machine %d.', program.programNo, machineId)

    const existingProgram = await machine.hasProgram(program.programNo)
    if (existingProgram) {
      await machine.updateProgram(program)
    } else {
      await machine.insertProgram(program)
    }

    await logEditorOperation(actCode, act1, act2)

    return { success: true }
  } catch (err: any) {
    log.error({ err }, 'Error creating program on machine %d.', machineId)
    handleProgramError(err)
    return { success: false, error: err.message }
  }
}

async function handleUpdateProgram(machine: MachineController, body: { program: Program, isNewVersion: boolean }, machineId: number, log: Logger): Promise<boolean> {
  try {
    log.info('Updated program %d on machine %d.', body.program.programNo, machineId)
    const { program, isNewVersion } = body
    return await machine.updateProgram(program, isNewVersion)
  } catch (err) {
    handleProgramError(err)
    return false
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
