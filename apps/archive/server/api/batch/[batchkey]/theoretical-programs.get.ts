import { db } from '~/server/database'
import type { Program, ProgramStep, ProgramStepCommand } from '~/types/archive'

interface PartialBatch {
  machineId: number
  programList: string
  startTime: Date
}

interface TheoreticalProgramsResult {
  programs: Program[]
  warnings: { programNo: number, changeDate: string }[]
  notFoundPrograms: number[]
}

interface RawProgram {
  name: string
  duration: number
  programNo: number
  programVersion: number
  originalIndex: number
  fromFallback?: boolean
  changeDate?: Date
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
      message: 'BATCH_NOT_FOUND',
    })
  }

  if (batch.programList.length) {
    const result = await getTheoreticalPrograms(batch)
    return result
  } else {
    return { programs: [], warnings: [], notFoundPrograms: [] }
  }
})

async function getTheoreticalPrograms(batch: PartialBatch): Promise<TheoreticalProgramsResult> {
  const config = useRuntimeConfig()
  const programList = batch.programList.split(',').map(Number)
  if (!programList.length) {
    return { programs: [], warnings: [], notFoundPrograms: [] }
  }

  // First, try to get programs from archive (BAMASTERPRGHEADER)
  const archivedPrograms = await db
    .from('BAMASTERPRGHEADER as P')
    .join(db.raw(/* sql */`(
      VALUES ${programList.map((p, i) => `(${p}, ${i})`)}
    ) T(PROGNO, PROGINDEX)`), 'P.PROGNO', 'T.PROGNO')
    .select({
      name: 'P.NAME',
      duration: 'P.DURATION',
      programNo: 'P.PROGNO',
      programVersion: 'P.MACHINEPRGVERSIONNO',
      originalIndex: 'T.PROGINDEX',
    })
    .where('P.MACHINEID', batch.machineId)
    .andWhere('P.RELEASEDATE', '<=', batch.startTime)
    .andWhere(function () {
      this.whereNull('P.RELEASEENDDATE')
        .orWhere('P.RELEASEENDDATE', '>', batch.startTime)
    })
    .orderBy('T.PROGINDEX') as RawProgram[]

  // Find missing programs that were not in archive
  const foundProgramNos = new Set(archivedPrograms.map(p => p.programNo))
  const missingProgramIndices = programList
    .map((progNo, index) => ({ progNo, index }))
    .filter(({ progNo }) => !foundProgramNos.has(progNo))

  // Fallback: get missing programs from BFMASTERPRGHEADER (current programs)
  let fallbackPrograms: RawProgram[] = []
  const warnings: TheoreticalProgramsResult['warnings'] = []
  const notFoundPrograms: number[] = []

  if (missingProgramIndices.length > 0) {
    fallbackPrograms = await db
      .from('BFMASTERPRGHEADER as P')
      .join(db.raw(/* sql */`(
        VALUES ${missingProgramIndices.map(m => `(${m.progNo}, ${m.index})`)}
      ) T(PROGNO, PROGINDEX)`), 'P.PROGNO', 'T.PROGNO')
      .select({
        name: 'P.NAME',
        duration: 'P.DURATION',
        programNo: 'P.PROGNO',
        originalIndex: 'T.PROGINDEX',
        changeDate: db.raw(`DATEADD(MINUTE, ?, P.CHANGEDATE)`, [config.teleskopTimezoneOffset]),
      })
      .where('P.MACHINEID', batch.machineId)
      .orderBy('T.PROGINDEX') as (RawProgram & { changeDate: Date })[]

    // Mark fallback programs and create warnings
    for (const prog of fallbackPrograms) {
      prog.fromFallback = true
      prog.programVersion = 0 // BF tables don't have version, use 0 as placeholder
      warnings.push({
        programNo: prog.programNo,
        changeDate: prog.changeDate?.toISOString() ?? '',
      })
    }

    // Find programs that were not found in either BA or BF tables
    const fallbackProgramNos = new Set(fallbackPrograms.map(p => p.programNo))
    for (const { progNo } of missingProgramIndices) {
      if (!fallbackProgramNos.has(progNo)) {
        notFoundPrograms.push(progNo)
      }
    }
  }

  // Merge and sort all programs by original index
  const rawPrograms = [...archivedPrograms, ...fallbackPrograms]
    .sort((a, b) => a.originalIndex - b.originalIndex)

  if (!rawPrograms.length) {
    return { programs: [], warnings: [], notFoundPrograms }
  }

  // Separate archived and fallback programs for different query strategies
  const archivedWithIndex = rawPrograms
    .map((p, idx) => ({ ...p, mergedIndex: idx }))
    .filter(p => !p.fromFallback)
  const fallbackWithIndex = rawPrograms
    .map((p, idx) => ({ ...p, mergedIndex: idx }))
    .filter(p => p.fromFallback)

  // Query helpers for archived programs (with version)
  const archivedProgramListWithVersions = () => archivedWithIndex.length > 0
    ? db.raw(/* sql */`(
      VALUES ${archivedWithIndex.map(p => `(${p.programNo}, ${p.mergedIndex}, ${p.programVersion})`)}
    ) T(PROGNO, PROGINDEX, PROGVERSION)`)
    : null

  // Query helpers for fallback programs (without version)
  const fallbackProgramList = () => fallbackWithIndex.length > 0
    ? db.raw(/* sql */`(
      VALUES ${fallbackWithIndex.map(p => `(${p.programNo}, ${p.mergedIndex})`)}
    ) T(PROGNO, PROGINDEX)`)
    : null

  // Fetch commands from both sources
  const rawCommands: {
    programIndex: number
    mainStep: number
    parallelStep: number
    commandNo: number
  }[] = []

  if (archivedWithIndex.length > 0) {
    const archivedCommands = await db
      .from('BAMASTERSTEPS as P')
      .join(archivedProgramListWithVersions()!, qb =>
        qb.on('P.PROGNO', 'T.PROGNO')
          .andOn('P.MACHINEPRGVERSIONNO', 'T.PROGVERSION'))
      .select({
        programIndex: 'T.PROGINDEX',
        mainStep: 'P.MAINSTEP',
        parallelStep: 'P.PARALELSTEP',
        commandNo: 'P.COMMANDNO',
      })
      .where('P.MACHINEID', batch.machineId)
    rawCommands.push(...archivedCommands)
  }

  if (fallbackWithIndex.length > 0) {
    const fallbackCommands = await db
      .from('BFMASTERSTEPS as P')
      .join(fallbackProgramList()!, 'P.PROGNO', 'T.PROGNO')
      .select({
        programIndex: 'T.PROGINDEX',
        mainStep: 'P.MAINSTEP',
        parallelStep: 'P.PARALELSTEP',
        commandNo: 'P.COMMANDNO',
      })
      .where('P.MACHINEID', batch.machineId)
    rawCommands.push(...fallbackCommands)
  }
  rawCommands.sort((a, b) => a.programIndex - b.programIndex || a.mainStep - b.mainStep || a.parallelStep - b.parallelStep)

  // Fetch parameters from both sources
  const rawParameters: {
    programIndex: number
    mainStep: number
    parallelStep: number
    value: number
    index: number
  }[] = []

  if (archivedWithIndex.length > 0) {
    const archivedParams = await db
      .from('BAMASTERSTEPPARAMS as P')
      .join(archivedProgramListWithVersions()!, qb =>
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
    rawParameters.push(...archivedParams)
  }

  if (fallbackWithIndex.length > 0) {
    const fallbackParams = await db
      .from('BFMASTERSTEPPARAMS as P')
      .join(fallbackProgramList()!, 'P.PROGNO', 'T.PROGNO')
      .select({
        programIndex: 'T.PROGINDEX',
        mainStep: 'P.MAINSTEP',
        parallelStep: 'P.PARALELSTEP',
        value: db.raw(`TRY_CAST(REPLACE(P.VALUE, ',', '.')  AS FLOAT)`),
        index: 'P.PARAMETERINDEX',
      })
      .where('P.MACHINEID', batch.machineId)
    rawParameters.push(...fallbackParams)
  }
  rawParameters.sort((a, b) => a.programIndex - b.programIndex || a.mainStep - b.mainStep || a.parallelStep - b.parallelStep || a.index - b.index)

  // Fetch IOs from both sources
  const rawIos: {
    programIndex: number
    mainStep: number
    parallelStep: number
    ioIndex: number
    ioId: number
  }[] = []

  if (archivedWithIndex.length > 0) {
    const archivedIos = await db
      .from('BAMASTERSTEPINPUTOUTPUTS as P')
      .join(archivedProgramListWithVersions()!, qb =>
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
    rawIos.push(...archivedIos)
  }

  if (fallbackWithIndex.length > 0) {
    const fallbackIos = await db
      .from('BFMASTERSTEPINPUTOUTPUTS as P')
      .join(fallbackProgramList()!, 'P.PROGNO', 'T.PROGNO')
      .select({
        programIndex: 'T.PROGINDEX',
        mainStep: 'P.MAINSTEP',
        parallelStep: 'P.PARALELSTEP',
        ioIndex: 'P.IOINDEX',
        ioId: 'P.IOID',
      })
      .where('P.MACHINEID', batch.machineId)
    rawIos.push(...fallbackIos)
  }
  rawIos.sort((a, b) => a.programIndex - b.programIndex || a.mainStep - b.mainStep || a.parallelStep - b.parallelStep || a.ioIndex - b.ioIndex)

  // Fetch IO selections from both sources
  const rawIoSelections: {
    programIndex: number
    mainStep: number
    parallelStep: number
    ioIndex: number
    ioType: number
    ioId: number
  }[] = []

  if (archivedWithIndex.length > 0) {
    const archivedSelections = await db
      .from('BAMASTERSTEPSELECTIONLIST as P')
      .join(archivedProgramListWithVersions()!, qb =>
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
    rawIoSelections.push(...archivedSelections)
  }

  if (fallbackWithIndex.length > 0) {
    const fallbackSelections = await db
      .from('BFMASTERSTEPSELECTIONLIST as P')
      .join(fallbackProgramList()!, 'P.PROGNO', 'T.PROGNO')
      .select({
        programIndex: 'T.PROGINDEX',
        mainStep: 'P.MAINSTEP',
        parallelStep: 'P.PARALELSTEP',
        ioIndex: 'P.IOINDEX',
        ioType: db.raw('P.IOTYPE + 1'),
        ioId: 'P.SELECTEDIOID',
      })
      .where('P.MACHINEID', batch.machineId)
    rawIoSelections.push(...fallbackSelections)
  }
  rawIoSelections.sort((a, b) => a.programIndex - b.programIndex || a.mainStep - b.mainStep || a.parallelStep - b.parallelStep || a.ioIndex - b.ioIndex)

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

  return { programs: result, warnings, notFoundPrograms }
}
