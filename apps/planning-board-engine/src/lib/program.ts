import type { Knex } from 'knex'
import type { TonelloProgram } from '@teleskop/core'
import { isDef } from '@teleskop/utils'
import { type MachineCommand, ParameterType } from './command'
import { PError } from './error'

export interface Program {
  machineId: number
  programNo: number
  name: string
  comment: string
  steps: ProgramStep[]
}

export interface ProgramStep {
  mainCommand: ProgramStepCommand
  parallelCommands: ProgramStepCommand[]
}

export interface ProgramStepCommand {
  commandNo: number
  parameters: {
    value: number | string
    index: number
  }[]
  ioList: {
    ioId: number
    ioIndex: number
    value: [number, number][]
  }[]
}

export async function fetchPrograms(db: Knex, machineId: number, programNos: number[]): Promise<Program[]> {
  if (!db.isTransaction) {
    await db.transaction(async (trx) => {
      return fetchPrograms(trx, machineId, programNos)
    })
  }

  programNos = Array.from(new Set(programNos))

  const rawPrograms = await db
    .from('BFMASTERPRGHEADER')
    .select({
      machineId: 'MACHINEID',
      programNo: 'PROGNO',
      name: 'NAME',
      comment: 'USERCOMMENT',
    })
    .whereIn('PROGNO', programNos)
    .andWhere('MACHINEID', machineId)

  if (!rawPrograms.length) {
    return []
  }
  if (rawPrograms.length !== programNos.length) {
    const foundProgramNos = rawPrograms.map(p => p.programNo)
    const missingProgramNos = programNos.filter(pn => !foundProgramNos.includes(pn))
    throw new PError('PROGRAM_NOT_FOUND', {
      machineId,
      missingProgramNos,
    })
  }

  const rawCommands = await db
    .from('BFMASTERSTEPS')
    .select({
      programNo: 'PROGNO',
      mainStep: 'MAINSTEP',
      parallelStep: 'PARALELSTEP',
      commandNo: 'COMMANDNO',
    })
    .whereIn('PROGNO', programNos)
    .andWhere('MACHINEID', machineId)
    .orderBy(['PROGNO', 'MAINSTEP', 'PARALELSTEP']) as {
    programNo: number
    mainStep: number
    parallelStep: number
    commandNo: number
  }[]

  const rawParameters = await db
    .from('BFMASTERSTEPPARAMS')
    .select({
      programNo: 'PROGNO',
      mainStep: 'MAINSTEP',
      parallelStep: 'PARALELSTEP',
      value: db.raw(`TRY_CAST(REPLACE(VALUE, ',', '.')  AS FLOAT)`),
      index: 'PARAMETERINDEX',
    })
    .whereIn('PROGNO', programNos)
    .andWhere('MACHINEID', machineId)
    .orderBy(['PROGNO', 'MAINSTEP', 'PARALELSTEP', 'PARAMETERINDEX']) as {
    programNo: number
    mainStep: number
    parallelStep: number
    value: number
    index: number
  }[]

  const rawIos = await db
    .from('BFMASTERSTEPINPUTOUTPUTS')
    .select({
      programNo: 'PROGNO',
      mainStep: 'MAINSTEP',
      parallelStep: 'PARALELSTEP',
      ioIndex: 'IOINDEX',
      ioId: 'IOID',
    })
    .whereIn('PROGNO', programNos)
    .andWhere('MACHINEID', machineId)
    .orderBy(['PROGNO', 'MAINSTEP', 'PARALELSTEP', 'IOINDEX']) as {
    programNo: number
    mainStep: number
    parallelStep: number
    ioIndex: number
    ioId: number
  }[]

  const rawIoSelections = await db
    .from('BFMASTERSTEPSELECTIONLIST as P')
    .select({
      programNo: 'PROGNO',
      mainStep: 'MAINSTEP',
      parallelStep: 'PARALELSTEP',
      ioIndex: 'IOINDEX',
      ioType: db.raw('IOTYPE + 1'),
      ioId: 'SELECTEDIOID',
    })
    .whereIn('PROGNO', programNos)
    .andWhere('MACHINEID', machineId)
    .orderBy(['PROGNO', 'MAINSTEP', 'PARALELSTEP', 'IOINDEX', 'SELECTIONINDEX']) as {
    programNo: number
    mainStep: number
    parallelStep: number
    ioIndex: number
    ioType: number
    ioId: number
  }[]

  const programs: Program[] = []
  let cmdCursor = 0
  let parCursor = 0
  let iosCursor = 0
  let selCursor = 0

  for (let i = 0; i < rawPrograms.length; i++) {
    const program: Program = {
      machineId,
      programNo: rawPrograms[i].programNo,
      name: rawPrograms[i].name,
      comment: rawPrograms[i].comment,
      steps: [],
    }
    programs.push(program)

    let currentStepIndex = 0
    let currentStep: ProgramStep = {
      mainCommand: null!,
      parallelCommands: [],
    }
    for (;cmdCursor < rawCommands.length; cmdCursor++) {
      const rawCommand = rawCommands[cmdCursor]
      // If command is not for current program, break
      if (rawCommand.programNo !== program.programNo) {
        break
      }
      // Push current step, proceed to next one
      if (rawCommand.mainStep !== currentStepIndex) {
        // If mainCommand is not initialised for some reason, skip
        if (currentStep.mainCommand) {
          program.steps.push(currentStep)
        }
        currentStepIndex = rawCommand.mainStep
        currentStep = {
          mainCommand: null!,
          parallelCommands: [],
        }
      }
      const currentCommand: ProgramStepCommand = {
        commandNo: rawCommand.commandNo,
        parameters: [],
        ioList: [],
      }
      if (!currentStep.mainCommand) {
        currentStep.mainCommand = currentCommand
      } else {
        currentStep.parallelCommands.push(currentCommand)
      }
      for (;parCursor < rawParameters.length; parCursor++) {
        const rawParameter = rawParameters[parCursor]
        if (rawParameter.programNo !== rawCommand.programNo
          || rawParameter.parallelStep !== rawCommand.parallelStep
          || rawParameter.mainStep !== rawCommand.mainStep) {
          break
        }
        currentCommand.parameters.push({
          index: rawParameter.index,
          value: rawParameter.value,
        })
      }
      for (; iosCursor < rawIos.length; iosCursor++) {
        const rawIo = rawIos[iosCursor]
        if (rawIo.programNo !== rawCommand.programNo
          || rawIo.parallelStep !== rawCommand.parallelStep
          || rawIo.mainStep !== rawCommand.mainStep
        ) {
          break
        }
        const currentIo: ProgramStepCommand['ioList'][0] = {
          ioId: rawIo.ioId,
          ioIndex: rawIo.ioIndex,
          value: [],
        }
        currentCommand.ioList.push(currentIo)
        for (; selCursor < rawIoSelections.length; selCursor++) {
          const rawIoSelection = rawIoSelections[selCursor]
          if (rawIoSelection.programNo !== rawIo.programNo
            || rawIoSelection.ioIndex !== rawIo.ioIndex
            || rawIoSelection.parallelStep !== rawIo.parallelStep
            || rawIoSelection.mainStep !== rawIo.mainStep) {
            break
          }
          currentIo.value.push([
            rawIoSelection.ioType,
            rawIoSelection.ioId,
          ])
        }
      }
    }
    // If mainCommand is not initialised for some reason, skip
    if (currentStep.mainCommand) {
      program.steps.push(currentStep)
    }
  }

  return programs
}

export async function fetchProgram(db: Knex, machineId: number, programNo: number): Promise<Program | null> {
  const programs = await fetchPrograms(db, machineId, [programNo])
  return programs.length ? programs[0] : null
}

export function transformProgramToTonello(program: Program, commands: MachineCommand[]): TonelloProgram {
  const tonelloProgram: TonelloProgram = {
    // TODO: Tonnelo'ya sorulacak numara mı olacak bu diye
    code: `${program.programNo}`,
    name: program.name,
    description: program.comment || '',
    type: 'program',
    params: [],
    stepsCount: program.steps.length,
    steps: program.steps.map((s, i) => ({
      step: i + 1,
      index: s.mainCommand.commandNo,
      version: 0,
      params: {
        bits: Array.from<0 | 1>({ length: 16 }).fill(0),
        values: Array.from<number>({ length: 64 }).fill(0),
      },
    })),
  }

  for (let i = 0; i < program.steps.length; i++) {
    const step = program.steps[i]
    const tonelloStep = tonelloProgram.steps[i]
    const cmd = step.mainCommand
    const cmdDef = commands.find(c => c.commandNo === cmd.commandNo)
    if (!cmdDef) {
      throw new PError('COMMAND_NOT_FOUND', {
        machineId: program.machineId,
        programNo: program.programNo,
        commandNo: cmd.commandNo,
      })
    }
    for (const param of cmd.parameters) {
      const paramDef = cmdDef.parameters.find(p => p.index === param.index)
      const paramDetails = {
        machineId: program.machineId,
        programNo: program.programNo,
        commandNo: cmd.commandNo,
        parameterIndex: param.index,
      }
      if (!paramDef) {
        throw new PError('MACHINE_PARAMETER_NOT_FOUND', paramDetails)
      }
      if (!isDef(paramDef.valueIndex)) {
        throw new PError('MACHINE_PARAMETER_INVALID', {
          ...paramDetails,
          reason: 'Tonello parameters require valueIndex to be set',
        })
      }
      if (paramDef.type !== ParameterType.CHECKBOX) {
        if (typeof param.value !== 'number') {
          throw new PError('MACHINE_PARAMETER_TYPE_ERROR', {
            ...paramDetails,
            expected: 'number',
          })
        }
        tonelloStep.params.values[paramDef.valueIndex] = param.value
      } else {
        tonelloStep.params.bits[paramDef.valueIndex] = param.value ? 1 : 0
      }
    }
  }

  return tonelloProgram
}

/**
 * Parses a comma-separated program number string into an array of numbers
 * Returns null if any of the program numbers are invalid
 *
 * @param programString
 * @returns Array of program numbers or null if invalid
 */
export function parseProgramNumbers(programString: string): number[] | null {
  const programNoList = programString.split(',').map(pn => Number.parseInt(pn, 10))
  return programNoList.some(Number.isNaN) ? null : programNoList
}
