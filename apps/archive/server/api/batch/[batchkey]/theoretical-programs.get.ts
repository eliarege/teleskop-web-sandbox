import { db } from '~/server/database'
import type { Program, ProgramStep, ProgramStepCommand } from '~/types/archive'

interface PartialBatch {
  machineId: number
  programList: string
  startTime: Date
}

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const batch = await db('BADATA').first({
    machineId: 'MACHINEID',
    programList: 'PROGRAMNOLIST',
    startTime: 'STARTTIME',
  }).where('BATCHKEY', batchKey) as PartialBatch

  if (!batch) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Batch not found',
    })
  }

  if (batch.programList.length) {
    const programs = await getTheoreticalPrograms(batch)
    return programs
  } else {
    return []
  }
})

async function getTheoreticalPrograms(batch: PartialBatch) {
  const programList = batch.programList.split(',').map(Number)

  const rawPrograms = await db
    .from('BAMASTERPRGHEADER as P')
    .join(db.raw(/* sql */`(
      VALUES ${programList.map((p, i) => `(${p}, ${i})`)}
    ) T(PROGNO, PROGINDEX)`), 'P.PROGNO', 'T.PROGNO')
    .select({
      name: 'P.NAME',
      duration: 'P.DURATION',
      programNo: 'P.PROGNO',
      programVersion: 'P.MACHINEPRGVERSIONNO',
    })
    .where('P.MACHINEID', batch.machineId)
    .andWhere('P.RELEASEDATE', '<=', batch.startTime)
    .andWhere(function () {
      this.whereNull('P.RELEASEENDDATE')
        .orWhere('P.RELEASEENDDATE', '>', batch.startTime)
    })
    .orderBy('T.PROGINDEX') as {
    name: string
    duration: number
    programNo: number
    programVersion: number
  }[]

  const programListWithVersions = () => db.raw(/* sql */`(
    VALUES ${rawPrograms.map((p, i) => `(${p.programNo}, ${i}, ${p.programVersion})`)}
  ) T(PROGNO, PROGINDEX, PROGVERSION)`)

  const rawCommands = await db
    .from('BAMASTERSTEPS as P')
    .join(programListWithVersions(), qb =>
      qb.on('P.PROGNO', 'T.PROGNO')
        .andOn('P.MACHINEPRGVERSIONNO', 'T.PROGVERSION'))
    .select({
      programIndex: 'T.PROGINDEX',
      mainStep: 'P.MAINSTEP',
      parallelStep: 'P.PARALELSTEP',
      commandNo: 'P.COMMANDNO',
    })
    .where('P.MACHINEID', batch.machineId)
    .orderBy(['T.PROGINDEX', 'P.MAINSTEP', 'P.PARALELSTEP']) as {
    programIndex: number
    mainStep: number
    parallelStep: number
    commandNo: number
  }[]

  const rawParameters = await db
    .from('BAMASTERSTEPPARAMS as P')
    .join(programListWithVersions(), qb =>
      qb.on('P.PROGNO', 'T.PROGNO')
        .andOn('P.MACHINEPRGVERSIONNO', 'T.PROGVERSION'))
    .select({
      programIndex: 'T.PROGINDEX',
      mainStep: 'P.MAINSTEP',
      parallelStep: 'P.PARALELSTEP',
      value: db.raw(`TRY_CAST(REPLACE(P.VALUE, ',', '.')  AS FLOAT)`),
      index: 'P.PARAMETERINDEX',
    })
    .where('P.MACHINEID', batch.machineId)
    .orderBy(['T.PROGINDEX', 'P.MAINSTEP', 'P.PARALELSTEP', 'P.PARAMETERINDEX']) as {
    programIndex: number
    mainStep: number
    parallelStep: number
    value: number
    index: number
  }[]

  const rawIos = await db
    .from('BAMASTERSTEPINPUTOUTPUTS as P')
    .join(programListWithVersions(), qb =>
      qb.on('P.PROGNO', 'T.PROGNO')
        .andOn('P.MACHINEPRGVERSIONNO', 'T.PROGVERSION'))
    .select({
      programIndex: 'T.PROGINDEX',
      mainStep: 'P.MAINSTEP',
      parallelStep: 'P.PARALELSTEP',
      ioIndex: 'P.IOINDEX',
      ioId: 'P.IOID',
    })
    .where('P.MACHINEID', batch.machineId)
    .orderBy(['T.PROGINDEX', 'P.MAINSTEP', 'P.PARALELSTEP', 'P.IOINDEX']) as {
    programIndex: number
    mainStep: number
    parallelStep: number
    ioIndex: number
    ioId: number
  }[]

  const rawIoSelections = await db
    .from('BAMASTERSTEPSELECTIONLIST as P')
    .join(programListWithVersions(), qb =>
      qb.on('P.PROGNO', 'T.PROGNO')
        .andOn('P.MACHINEPRGVERSIONNO', 'T.PROGVERSION'))
    .select({
      programIndex: 'T.PROGINDEX',
      mainStep: 'P.MAINSTEP',
      parallelStep: 'P.PARALELSTEP',
      ioIndex: 'P.IOINDEX',
      ioType: db.raw('P.IOTYPE + 1'),
      ioId: 'P.SELECTEDIOID',
    })
    .where('P.MACHINEID', batch.machineId)
    .orderBy(['T.PROGINDEX', 'P.MAINSTEP', 'P.PARALELSTEP', 'P.IOINDEX', 'P.SELECTIONINDEX']) as {
    programIndex: number
    mainStep: number
    parallelStep: number
    ioIndex: number
    ioType: number
    ioId: number
  }[]

  let cmdCursor = 0
  let parCursor = 0
  let iosCursor = 0
  let selCursor = 0

  const result = [] as Program[]

  for (let programIndex = 0; programIndex < rawPrograms.length; programIndex++) {
    const rawProgram = rawPrograms[programIndex]
    const program: Program = {
      name: rawProgram.name,
      duration: rawProgram.duration,
      programNo: rawProgram.programNo,
      steps: [],
    }
    result.push(program)
    let currentStepIndex = 0
    let currentStep = {
      mainCommand: null as ProgramStepCommand | null,
      parallelCommands: [] as ProgramStepCommand[],
    }
    for (;cmdCursor < rawCommands.length; cmdCursor++) {
      const rawCommand = rawCommands[cmdCursor]
      if (rawCommand.programIndex !== programIndex) {
        break
      }
      // Push current step, proceed to next one
      if (rawCommand.mainStep !== currentStepIndex) {
        // If mainCommand is not initialised for some reason, skip
        if (currentStep.mainCommand) {
          program.steps.push(currentStep as ProgramStep)
        }
        currentStepIndex = rawCommand.mainStep
        currentStep = {
          mainCommand: null,
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
        if (rawParameter.parallelStep !== rawCommand.parallelStep || rawParameter.mainStep !== rawCommand.mainStep || rawParameter.programIndex !== programIndex) {
          break
        }
        currentCommand.parameters.push({
          value: rawParameter.value,
          index: rawParameter.index,
        })
      }
      for (;iosCursor < rawIos.length; iosCursor++) {
        const rawIo = rawIos[iosCursor]
        if (rawIo.parallelStep !== rawCommand.parallelStep || rawIo.mainStep !== rawCommand.mainStep || rawIo.programIndex !== programIndex) {
          break
        }
        const currentIo: ProgramStepCommand['ioList'][0] = {
          ioId: rawIo.ioId,
          ioIndex: rawIo.ioIndex,
          value: [],
        }
        currentCommand.ioList.push(currentIo)
        for (;selCursor < rawIoSelections.length; selCursor++) {
          const rawIoSelection = rawIoSelections[selCursor]
          if (rawIoSelection.ioIndex !== rawIo.ioIndex || rawIoSelection.parallelStep !== rawIo.parallelStep || rawIoSelection.mainStep !== rawIo.mainStep || rawIoSelection.programIndex !== programIndex) {
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
      program.steps.push(currentStep as ProgramStep)
    }
  }

  return result
}
