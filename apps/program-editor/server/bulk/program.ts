import type { Knex } from 'knex'
import type { Machine, MachineCommand, Program, ProgramStep, ProgramStepCommand } from '~/shared/types'
import { validateProgram } from '~/shared/utils'

type RawStep = {
  machineId: number
  progNo: number
  mainStep: number
  parallelStep: number
  commandNo: number
}

type RawStepParameter = {
  machineId: number
  progNo: number
  mainStep: number
  parallelStep: number
  value: number
  index: number
  optimized: boolean
}

type RawStepIO = {
  machineId: number
  progNo: number
  mainStep: number
  parallelStep: number
  ioIndex: number
  ioId: number
}

type RawStepIOSelection = {
  machineId: number
  progNo: number
  mainStep: number
  parallelStep: number
  ioIndex: number
  ioType: number
  ioId: number
}

export async function fetchAllPrograms(db: Knex, machines: Machine[]): Promise<Program[]> {
  const machineIds = [...new Set(machines.map(p => p.id))]

  const [
    rawPrograms,
    rawSteps,
    rawStepParameters,
    rawStepIOs,
    rawStepIOSelections,
  ] = await Promise.all([
    fetchRawProgramHeaders(db, machineIds),
    fetchRawSteps(db, machineIds),
    fetchRawStepParameters(db, machineIds),
    fetchRawStepIOs(db, machineIds),
    fetchRawStepIOSelections(db, machineIds),
  ])

  const machineMap = new Map<number, Machine>()
  for (const machine of machines) {
    machineMap.set(machine.id, machine)
  }

  const results: Program[] = []

  let cmdCursor = 0
  let parCursor = 0
  let iosCursor = 0
  let selCursor = 0

  for (const rawProgram of rawPrograms) {
    const program: Program = { ...rawProgram, steps: [] }

    let currentStepIndex = 0
    let commandIdCounter = 0
    let currentStep: ProgramStep = {
      stepId: 0,
      mainCommand: null!,
      parallelCommands: [],
    }

    for (; cmdCursor < rawSteps.length; cmdCursor++) {
      const rawCommand = rawSteps[cmdCursor]
      if (rawCommand.machineId !== program.machineId || rawCommand.progNo !== program.programNo) {
        break
      }
      if (rawCommand.mainStep !== currentStepIndex) {
        if (currentStep.mainCommand) {
          program.steps.push(currentStep as ProgramStep)
        }
        currentStepIndex = rawCommand.mainStep
        commandIdCounter = 0
        currentStep = {
          stepId: currentStepIndex,
          mainCommand: null!,
          parallelCommands: [],
        }
      }
      const currentCommand: ProgramStepCommand = {
        commandId: commandIdCounter++,
        commandNo: rawCommand.commandNo,
        parameters: [],
        ioList: [],
      }
      if (!currentStep.mainCommand) {
        currentStep.mainCommand = currentCommand
      }
      else {
        currentStep.parallelCommands.push(currentCommand)
      }
      for (; parCursor < rawStepParameters.length; parCursor++) {
        const rawParameter = rawStepParameters[parCursor]
        if (rawParameter.machineId !== program.machineId
          || rawParameter.progNo !== program.programNo
          || rawParameter.parallelStep !== rawCommand.parallelStep
          || rawParameter.mainStep !== rawCommand.mainStep) {
          break
        }
        currentCommand.parameters.push({
          value: rawParameter.value,
          index: rawParameter.index,
          optimized: rawParameter.optimized,
        })
      }
      for (; iosCursor < rawStepIOs.length; iosCursor++) {
        const rawIo = rawStepIOs[iosCursor]
        if (rawIo.machineId !== program.machineId
          || rawIo.progNo !== program.programNo
          || rawIo.parallelStep !== rawCommand.parallelStep
          || rawIo.mainStep !== rawCommand.mainStep) {
          break
        }
        const currentIo: ProgramStepCommand['ioList'][0] = {
          ioId: rawIo.ioId,
          ioIndex: rawIo.ioIndex,
          value: [],
        }
        currentCommand.ioList.push(currentIo)
        for (; selCursor < rawStepIOSelections.length; selCursor++) {
          const rawIoSelection = rawStepIOSelections[selCursor]
          if (rawIoSelection.machineId !== program.machineId
            || rawIoSelection.progNo !== program.programNo
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
    if (currentStep.mainCommand) {
      program.steps.push(currentStep as ProgramStep)
    }
    const machine = machineMap.get(program.machineId)!
    const commands = [...machine.commands.values()]
    validateProgram(program, commands)
    results.push(program)
  }

  return results
}

async function fetchRawProgramHeaders(db: Knex, machineIds: number[]): Promise<Omit<Program, 'steps'>[]> {
  return await db
    .select({
      name: 'P.NAME',
      icon: db.raw('CASE P.ICONNAME WHEN \'\' THEN \'null\' END'),
      programNo: 'P.PROGNO',
      duration: 'P.DURATION',
      author: 'P.LOCKEDBY',
      comment: 'P.USERCOMMENT',
      typeId: 'P.PROCESSCODE',
      typeName: 'PT.PROCESSNAME',
      additionalTypeId: 'P.ADDITIONALPROCESSCODE',
      additionalTypeName: 'APT.PROCESSNAME',
      machineId: 'M.MACHINEID',
      prgState: 'P.PRGSTATE',
      isChanged: 'P.ISCHANGED',
      createdAt: 'P.CREATIONDATE',
      updatedAt: 'P.CHANGEDATE',
      updatedAtTBB: 'P.TBBCHANGEDATE',
      machineName: 'M.MACHINECODE',
      tbbProgramChangedEvent: db.raw(`CASE P.TBBPRGCHANGEDEVENT WHEN 0 THEN 0 ELSE 1 END`),
      totalChemReq: 'P.TotalChemReq',
      totalDyeReq: 'P.TotalDyeReq',
      manChemReq: 'P.ManChemReq',
      autoChemReq: 'P.AutoChemReq',
      autoDyeReq: 'P.AutoDyeReq',
      manDyeReq: 'P.ManDyeReq',
      saltReq: 'P.TOTALSALTREQ',
      genericMat1Req: 'P.TOTALGM1REQ',
      genericMat2Req: 'P.TOTALGM2REQ',
    })
    .from('BFMASTERPRGHEADER AS P')
    .join('BFMACHINES AS M', 'M.MACHINEID', 'P.MACHINEID')
    .join('BFPROCESSTYPES AS PT', 'PT.PROCESSCODE', 'P.PROCESSCODE')
    .leftJoin('BFPROCESSTYPES AS APT', 'APT.PROCESSCODE', 'P.ADDITIONALPROCESSCODE')
    .where('M.USEINTELESKOP', 1)
    .andWhere('M.INUSE', 1)
    .whereIn('P.MACHINEID', machineIds)
    .orderBy(['P.MACHINEID', 'P.PROGNO']) as Omit<Program, 'steps'>[]
}

async function fetchRawSteps(db: Knex, machineIds: number[]): Promise<RawStep[]> {
  return await db
    .from('BFMASTERSTEPS as P')
    .select({
      machineId: 'P.MACHINEID',
      progNo: 'P.PROGNO',
      mainStep: 'P.MAINSTEP',
      parallelStep: 'P.PARALELSTEP',
      commandNo: 'P.COMMANDNO',
    })
    .whereIn('P.MACHINEID', machineIds)
    .orderBy(['P.MACHINEID', 'P.PROGNO', 'P.MAINSTEP', 'P.PARALELSTEP']) as RawStep[]
}

async function fetchRawStepParameters(db: Knex, machineIds: number[]): Promise<RawStepParameter[]> {
  return await db
    .from('BFMASTERSTEPPARAMS as P')
    .select({
      machineId: 'P.MACHINEID',
      progNo: 'P.PROGNO',
      mainStep: 'P.MAINSTEP',
      parallelStep: 'P.PARALELSTEP',
      value: db.raw(`TRY_CAST(REPLACE(P.VALUE, ',', '.')  AS FLOAT)`),
      index: 'P.PARAMETERINDEX',
      optimized: 'P.OPTIMIZED',
    })
    .whereIn('P.MACHINEID', machineIds)
    .orderBy(['P.MACHINEID', 'P.PROGNO', 'P.MAINSTEP', 'P.PARALELSTEP', 'P.PARAMETERINDEX']) as RawStepParameter[]
}

async function fetchRawStepIOs(db: Knex, machineIds: number[]): Promise<RawStepIO[]> {
  return await db
    .from('BFMASTERSTEPINPUTOUTPUTS as P')
    .select({
      machineId: 'P.MACHINEID',
      progNo: 'P.PROGNO',
      mainStep: 'P.MAINSTEP',
      parallelStep: 'P.PARALELSTEP',
      ioIndex: 'P.IOINDEX',
      ioId: 'P.IOID',
    })
    .whereIn('P.MACHINEID', machineIds)
    .orderBy(['P.MACHINEID', 'P.PROGNO', 'P.MAINSTEP', 'P.PARALELSTEP', 'P.IOINDEX']) as RawStepIO[]
}

async function fetchRawStepIOSelections(db: Knex, machineIds: number[]): Promise<RawStepIOSelection[]> {
  return await db
    .from('BFMASTERSTEPSELECTIONLIST as P')
    .select({
      machineId: 'P.MACHINEID',
      progNo: 'P.PROGNO',
      mainStep: 'P.MAINSTEP',
      parallelStep: 'P.PARALELSTEP',
      ioIndex: 'P.IOINDEX',
      ioType: db.raw('P.IOTYPE + 1'),
      ioId: 'P.SELECTEDIOID',
    })
    .whereIn('P.MACHINEID', machineIds)
    .orderBy(['P.MACHINEID', 'P.PROGNO', 'P.MAINSTEP', 'P.PARALELSTEP', 'P.IOINDEX', 'P.SELECTIONINDEX']) as RawStepIOSelection[]
}
