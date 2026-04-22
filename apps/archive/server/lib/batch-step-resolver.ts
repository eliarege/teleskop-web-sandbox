import { db } from '../database'

// Type definitions
interface Batch {
  machineId: number
  programList: number[]
  startTime: Date
  endTime: Date | null
  cancelTime: Date | null
}

interface MachineCommand {
  machineId: number
  commandNo: number
  name: string
  icon: string
  activated: boolean
  adviceList: string
  dontUseList: number[]
  isRunManual: boolean
  moveParallel: number
  x: string
  y: string
  a: string
  maxA: string
  b: string
  isTemperature: number
  isUnload: number
  parameters: CommandParameter[]
  ioList: CommandIO[]
}

export interface CommandParameter {
  index: number
  name: string
  group: number | null
  format: string
  value: string
  valueIndex: number | null
  minValue: number
  maxValue: number
  containsVariable: boolean
  useDefault: boolean
  useFormula: boolean
}

export interface CommandIO {
  index: number
  ioId: number
  type: number
  selectable: boolean
  name: string
  selections: CommandIOSelection[]
}

export interface CommandIOSelection {
  index: number
  type: number
  name: string
  defaultValue: boolean
  ioId: number
}

interface TheoreticalProgram {
  machineId: number
  programNo: number
  steps: ProgramStep[]
}

interface ProgramStep {
  stepId: number
  mainCommand: ProgramStepCommand
  parallelCommands: ProgramStepCommand[]
}

interface ProgramStepCommand {
  commandId: number
  commandNo: number
  parameters: Parameter[]
  ioList: IoListEntry[]
}

interface Parameter {
  index: number
  value: number
}

interface IoListEntry {
  ioId: number
  index: number
  selections: [number, number][]
}

interface ActualStepCommand {
  programNo: number
  stepNo: number
  parallelIndex: number
  commandNo: number
  startTime: Date
  endTime: Date | null
}

interface StepChange {
  stepNo: number
  parallelIndex: number
  commandNo: number
  action: 'added' | 'removed'
  changeDate: Date
}

interface ParameterChange {
  programNo: number
  stepNo: number
  parallelIndex: number
  parameterIndex: number
  commandNo: number
  oldValue: string
  newValue: string
  changeDate: Date
}

interface IoSelectionChange {
  programNo: number
  stepNo: number
  parallelIndex: number
  commandNo: number
  ioIndex: number
  ioSelectIndex: number
  newValue: boolean
  changeDate: Date
}

interface Result {
  mainCommand: ResultCommand
  parallelCommands: ResultCommand[]
}

interface ResultCommand {
  commandNo: number
  parameters: {
    index: number
    actualValue: number
    theoreticalValue: number
  }[]
  ioList: {
    index: number
    actualSelections: [number, number][]
    theoreticalSelections: [number, number][]
  }[]
}

// Stub function declarations (these would be implemented elsewhere)
async function fetchBatch(batchKey: number): Promise<Batch> {
  const batch = await db('BADATA')
    .select({
      machineId: 'MACHINEID',
      programList: 'PROGRAMNOLIST',
      startTime: 'STARTTIME',
      endTime: 'ENDTIME',
      cancelTime: 'CANCELTIME',
    })
    .where('BATCHKEY', batchKey)
    .first()

  if (!batch) {
    throw new Error(`Batch not found for batchKey: ${batchKey}`)
  }

  // Convert programList from comma-separated string to number array
  batch.programList = String(batch.programList)
    .split(',')
    .map(str => str.trim())
    .filter(str => str !== '')
    .map(Number)
    .filter(Number.isFinite)

  return batch
}

/**
 * Mevcut makinenin komutlarını getirir
 * @returns {Promise<MachineCommand[]>} - Komutlar
 */
export async function fetchCommands(machineId: number, batchStartTime: Date): Promise<MachineCommand[]> {
  const commands = await db
    .from('BAMASTERCOMMANDS')
    .select({
      machineId: 'MACHINEID',
      commandNo: 'COMMANDNO',
      name: 'NAME',
      icon: 'ICON',
      activated: 'ACTIVATED',
      adviceList: 'ADVICELIST',
      dontUseList: 'DONTUSELIST',
      isRunManual: 'ISRUNMANUAL',
      commandType: 'COMMANDTYPE',
      moveParallel: 'MOVEPARALLEL',
      x: 'X',
      y: 'Y',
      a: 'A',
      maxA: 'MAXA',
      b: 'B',
      isTemperature: 'ISTEMPERATURE',
      isUnload: 'ISUNLOAD',
      machineCommandSetNo: 'MACHINECOMMANDSETNO',
    })
    .where('MACHINEID', machineId)
    .andWhere('RELEASEDATE', '<=', batchStartTime)
    .andWhere((b) => {
      b.whereNull('RELEASEENDDATE').orWhere('RELEASEENDDATE', '>', batchStartTime)
    })
    // .andWhere('ACTIVATED', 1)
    .orderBy('COMMANDNO') as unknown as (MachineCommand & { machineCommandSetNo: number })[]

  const commandSetNos = [...new Set(commands.map(c => c.machineCommandSetNo))]

  const parameters = await db
    .from('BACOMMANDPARAMETERS as P')
    .select({
      commandNo: 'P.COMMANDNO',
      index: 'P.PARAMETERINDEX',
      name: 'P.PARAMSTRING',
      group: 'P.PARAMETERGROUP',
      type: db.raw(`
          CASE
            WHEN TBBFORMUL = 1 THEN 'MACHINE_FORMULA'
            WHEN USEFORMULA = 1 THEN 'SELECTABLE_FORMULA'
            WHEN PARAMETERTYPE = 0 THEN 'NUMBER'
            WHEN PARAMETERTYPE = 1 THEN 'SELECT'
            WHEN PARAMETERTYPE = 2 THEN 'CHECKBOX'
            WHEN PARAMETERTYPE = 3 THEN 'SELECT_ADDITIVE'
          END
        `),
      format: db.raw(`
          CASE TEMPERATURE
            WHEN 0 THEN 'NONE'
            WHEN 1 THEN 'TEMPERATURE'
            ELSE 'DURATION'
          END
        `),
      value: 'P.VALUE',
      valueIndex: 'P.VALUEINDEX',
      minValue: 'P.PARAMLOWLIMIT',
      maxValue: 'P.PARAMHIGHLIMIT',
      containsVariable: 'P.CONTAINSVARIABLE',
      useDefault: 'P.USEDEFAULT',
      useFormula: 'P.USEFORMULA',
      selectionLabels: db.raw(`NULLIF(P.SELECTIONLIST, '')`),
      selectionValues: db.raw(`NULLIF(P.SELECTIONVALUES, '')`),
    })
    .where('P.MACHINEID', machineId)
    .whereIn('P.MACHINECOMMANDSETNO', commandSetNos)
    .orderBy(['P.COMMANDNO', 'P.PARAMETERINDEX'])

  const ioList = await db
    .from('BACOMMANDINPUTOUTPUTS as IO')
    .select({
      commandNo: 'IO.COMMANDNO',
      index: 'IO.IOINDEX',
      ioId: 'IO.IOID',
      type: db.raw('IO.IOTYPE'),
      selectable: db.raw(`CAST(CASE IO.IOTYPE WHEN 5 THEN 1 ELSE 0 END as bit)`),
      name: 'IO.NAME',
    })
    .where('IO.MACHINEID', machineId)
    .whereIn('IO.MACHINECOMMANDSETNO', commandSetNos)
    .orderBy(['IO.COMMANDNO', 'IO.IOINDEX'])

  const ioListSelections = await db
    .from('BACOMMANDSELECTIONLIST as S')
    .select({
      commandNo: 'S.COMMANDNO',
      ioIndex: 'S.IOINDEX',
      index: 'S.SELECTINDEX',
      type: db.raw('S.IOTYPE + 1'),
      name: 'S.NAME',
      defaultValue: 'S.ISDEFAULT',
      ioId: 'S.IOID',
    })
    .where('S.MACHINEID', machineId)
    .whereIn('S.MACHINECOMMANDSETNO', commandSetNos)
    .orderBy(['S.COMMANDNO', 'S.IOINDEX', 'S.SELECTINDEX'])

  let parCursor = 0
  let iosCursor = 0
  let selCursor = 0

  for (const command of commands) {
    command.parameters = []
    command.ioList = []

    command.dontUseList = String(command.dontUseList)
      .split(',')
      .map(num => Number(num.trim()))
      .filter(Number.isFinite)

    for (; parCursor < parameters.length; parCursor++) {
      const rawParameter = parameters[parCursor]
      if (rawParameter.commandNo !== command.commandNo) {
        break
      }

      command.parameters.push({
        index: rawParameter.index,
        name: rawParameter.name,
        group: rawParameter.group,
        format: rawParameter.format,
        value: rawParameter.value,
        valueIndex: rawParameter.valueIndex,
        minValue: rawParameter.minValue,
        maxValue: rawParameter.maxValue,
        containsVariable: rawParameter.containsVariable,
        useDefault: rawParameter.useDefault,
        useFormula: rawParameter.useFormula,
        // selections,
      })
    }
    for (; iosCursor < ioList.length; iosCursor++) {
      const rawIo = ioList[iosCursor]
      if (rawIo.commandNo !== command.commandNo) {
        break
      }
      const currentIo: CommandIO = {
        index: rawIo.index,
        ioId: rawIo.ioId,
        type: rawIo.type,
        selectable: rawIo.selectable,
        name: rawIo.name,
        selections: [],
      }
      command.ioList.push(currentIo)
      for (; selCursor < ioListSelections.length; selCursor++) {
        const rawIoSelection = ioListSelections[selCursor]
        if (rawIoSelection.ioIndex !== rawIo.index || rawIoSelection.commandNo !== rawIo.commandNo) {
          break
        }
        currentIo.selections.push({
          index: rawIoSelection.index,
          type: rawIoSelection.type,
          name: rawIoSelection.name,
          defaultValue: rawIoSelection.defaultValue,
          ioId: rawIoSelection.ioId,
        })
      }
    }
  }

  return commands
}

/**
 * Program numarası ve versiyon numarasına göre arşivlenmiş programı getirir
 * @param {number} machineId - Makine ID'si
 * @param {number} programNo - Program numarası
 * @param {Date} batchStartTime - İş emrinin başlama zamanı
 * @returns {Promise<{ program: Program }>} - Program
 */
async function fetchTheoreticalProgram(machineId: number, programNo: number, batchStartTime: Date): Promise<TheoreticalProgram> {
  const program = await db
    .first({
      name: 'P.NAME',
      icon: db.raw('CASE P.ICONNAME WHEN \'\' THEN \'null\' END'),
      programNo: 'P.PROGNO',
      programVersion: 'P.MACHINEPRGVERSIONNO',
      author: 'P.USERNAME',
      comment: 'P.USERCOMMENT',
      typeId: 'P.PROCESSCODE',
      typeName: 'PT.PROCESSNAME',
      additionalTypeId: 'P.ADDITIONALPROCESSCODE',
      additionalTypeName: 'APT.PROCESSNAME',
      machineId: 'M.MACHINEID',
      machineName: 'M.MACHINECODE',
    })
    .from('BAMASTERPRGHEADER AS P')
    .join('BFMACHINES AS M', 'M.MACHINEID', 'P.MACHINEID')
    .join('BFPROCESSTYPES AS PT', 'PT.PROCESSCODE', 'P.PROCESSCODE')
    .leftJoin('BFPROCESSTYPES AS APT', 'APT.PROCESSCODE', 'P.ADDITIONALPROCESSCODE')
    .where('P.PROGNO', programNo)
    .andWhere('M.MACHINEID', machineId)
    .andWhere('P.RELEASEDATE', '<=', batchStartTime)
    .andWhere((builder) => {
      builder.where('P.RELEASEENDDATE', '>', batchStartTime)
        .orWhereNull('P.RELEASEENDDATE')
    })

  if (!program) {
    throw new Error('PROGRAM_FAILED_TO_LOAD' + ` (Program No: ${programNo}, Machine ID: ${machineId})`)
  }

  const rawCommands = await db
    .from('BAMASTERSTEPS as P')
    .select({
      mainStep: 'P.MAINSTEP',
      parallelStep: 'P.PARALELSTEP',
      commandNo: 'P.COMMANDNO',
    })
    .where('P.MACHINEID', machineId)
    .andWhere('P.PROGNO', programNo)
    .andWhere('P.MACHINEPRGVERSIONNO', program.programVersion)
    .orderBy(['P.MAINSTEP', 'P.PARALELSTEP']) as {
    mainStep: number
    parallelStep: number
    commandNo: number
  }[]

  const rawParameters = await db
    .from('BAMASTERSTEPPARAMS as P')
    .select({
      mainStep: 'P.MAINSTEP',
      parallelStep: 'P.PARALELSTEP',
      value: db.raw(`TRY_CAST(REPLACE(P.VALUE, ',', '.')  AS FLOAT)`),
      index: 'P.PARAMETERINDEX',
      optimized: 'P.OPTIMIZED',
    })
    .where('P.MACHINEID', machineId)
    .andWhere('P.PROGNO', programNo)
    .andWhere('P.MACHINEPRGVERSIONNO', program.programVersion)
    .orderBy(['P.MAINSTEP', 'P.PARALELSTEP', 'P.PARAMETERINDEX']) as {
    mainStep: number
    parallelStep: number
    value: number
    index: number
    optimized: boolean
  }[]

  const rawIos = await db
    .from('BAMASTERSTEPINPUTOUTPUTS as P')
    .select({
      mainStep: 'P.MAINSTEP',
      parallelStep: 'P.PARALELSTEP',
      ioIndex: 'P.IOINDEX',
      ioId: 'P.IOID',
    })
    .where('P.MACHINEID', machineId)
    .andWhere('P.PROGNO', programNo)
    .andWhere('P.MACHINEPRGVERSIONNO', program.programVersion)
    .orderBy(['P.MAINSTEP', 'P.PARALELSTEP', 'P.IOINDEX']) as {
    mainStep: number
    parallelStep: number
    ioIndex: number
    ioId: number
  }[]

  const rawIoSelections = await db
    .from('BAMASTERSTEPSELECTIONLIST as P')
    .select({
      mainStep: 'P.MAINSTEP',
      parallelStep: 'P.PARALELSTEP',
      ioIndex: 'P.IOINDEX',
      ioType: db.raw('P.IOTYPE + 1'),
      ioId: 'P.SELECTEDIOID',
    })
    .where('P.MACHINEID', machineId)
    .andWhere('P.PROGNO', programNo)
    .andWhere('P.MACHINEPRGVERSIONNO', program.programVersion)
    .orderBy(['P.MAINSTEP', 'P.PARALELSTEP', 'P.IOINDEX', 'P.SELECTIONINDEX']) as {
    mainStep: number
    parallelStep: number
    ioIndex: number
    ioType: number
    ioId: number
  }[]

  let parCursor = 0
  let iosCursor = 0
  let selCursor = 0

  program.steps = []

  let currentStepIndex = 0
  let commandIdCounter = 0
  let currentStep: ProgramStep = {
    stepId: 0,
    mainCommand: null!,
    parallelCommands: [],
  }
  for (let i = 0; i < rawCommands.length; i++) {
    const rawCommand = rawCommands[i]
    // Push current step, proceed to next one
    if (rawCommand.mainStep !== currentStepIndex) {
      // If mainCommand is not initialised for some reason, skip
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
    } else {
      currentStep.parallelCommands.push(currentCommand)
    }
    for (;parCursor < rawParameters.length; parCursor++) {
      const rawParameter = rawParameters[parCursor]
      if (rawParameter.parallelStep !== rawCommand.parallelStep || rawParameter.mainStep !== rawCommand.mainStep) {
        break
      }
      currentCommand.parameters.push({
        value: rawParameter.value,
        index: rawParameter.index,
      })
    }
    for (;iosCursor < rawIos.length; iosCursor++) {
      const rawIo = rawIos[iosCursor]
      if (rawIo.parallelStep !== rawCommand.parallelStep || rawIo.mainStep !== rawCommand.mainStep) {
        break
      }
      const currentIo: ProgramStepCommand['ioList'][0] = {
        ioId: rawIo.ioId,
        index: rawIo.ioIndex,
        selections: [],
      }
      currentCommand.ioList.push(currentIo)
      for (;selCursor < rawIoSelections.length; selCursor++) {
        const rawIoSelection = rawIoSelections[selCursor]
        if (rawIoSelection.ioIndex !== rawIo.ioIndex
          || rawIoSelection.parallelStep !== rawIo.parallelStep
          || rawIoSelection.mainStep !== rawIo.mainStep) {
          break
        }
        currentIo.selections.push([
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

  return { machineId, programNo, steps: program.steps }
}

/**
 * İş emrinde çalışmış ana adımlarını, çalışmaya başlama zamanlarına göre sıralı (artan) olarak döner.
 * @param {number} batchKey - İş emri numarası
 * @param {Date} time - Zaman
 * @returns {Promise<ActualStepCommand[]>} - Ana adımlar
 */
async function fetchActualStepsAtTime(batchKey: number, time: Date): Promise<ActualStepCommand[]> {
  const { teleskopTimezoneOffset } = useRuntimeConfig()

  return await db
    .from('BAACTUALPRGSTEPS')
    .select({
      stepNo: 'STEPNO',
      programNo: 'PRGNO',
      commandNo: 'COMMANDNO',
      parallelIndex: 'PARALLELSTEPNO',
      startTime: db.raw(`DATEADD(MINUTE, ?, STARTTIME)`, teleskopTimezoneOffset),
      endTime: db.raw(`DATEADD(MINUTE, ?, ENDTIME)`, teleskopTimezoneOffset),
    })
    .where('BATCHKEY', '=', batchKey)
    .andWhere('STARTTIME', '<=', time)
    .andWhere(q =>
      q.whereNull('ENDTIME').orWhere('ENDTIME', '>=', time),
    )
    .orderBy(['STARTTIME', 'STEPNO', 'PARALLELSTEPNO'])
}

/**
 * İş emrinde gerçekleşen adım değişikliklerini getirir
 * @param {number} batchKey - İş emri numarası
 * @returns {Promise<StepChange[]>} - Adım değişiklikleri
 */
async function fetchBatchStepChanges(batchKey: number): Promise<StepChange[]> {
  return db
    .select({
      stepNo: 'MAINSTEP',
      parallelIndex: 'PARALELSTEP',
      commandNo: 'COMMANDNO',
      action: db.raw(`CASE STEPADDED WHEN 1 THEN 'added' WHEN 2 THEN 'removed' END`),
      changeDate: 'CHANGEDATE',
    })
    .from('BASTEPCHANGES')
    .where('BATCHKEY', batchKey)
    .orderBy('CHANGEDATE')
}

/**
 * İş emrinde gerçekleşen parametre değişikliklerini getirir
 * @param {number} batchKey - İş emri numarası
 * @returns {Promise<ParameterChange[]>} - Parametre değişiklikleri
 */
async function fetchBatchParameterChanges(batchKey: number): Promise<ParameterChange[]> {
  return db
    .select({
      programNo: 'PROGNO',
      stepNo: 'MAINSTEP',
      parallelIndex: 'PARALELSTEP',
      parameterIndex: 'SPINDEX',
      commandNo: 'COMMANDNO',
      oldValue: 'OLDVALUE',
      newValue: 'NEWVALUE',
      changeDate: 'CHANGEDATE',
    })
    .from('BASETPOINTCHANGES')
    .where('BATCHKEY', batchKey)
    .orderBy('CHANGEDATE')
}

/**
 * İş emrinde gerçekleşen IO seçim değişikliklerini getirir
 * @param {number} batchKey - İş emri numarası
 * @returns {Promise<IoSelectionChange[]>} - IO seçim değişiklikleri
 */
async function fetchBatchIoSelectionChanges(batchKey: number): Promise<IoSelectionChange[]> {
  return db
    .select({
      programNo: 'PROGNO',
      stepNo: 'MAINSTEP',
      parallelIndex: 'PARALELSTEP',
      commandNo: 'COMMANDNO',
      ioIndex: 'IOINDEX',
      ioSelectIndex: 'IOSELECTLISTINDEX',
      newValue: 'NEWVALUE',
      changeDate: 'CHANGEDATE',
    })
    .from('BAIOSELECTIONCHANGES')
    .where('BATCHKEY', batchKey)
    .orderBy('CHANGEDATE')
}

/**
 * Calculates the adjusted step number based on step changes that occurred before a given time.
 * When steps are added/removed during batch execution, subsequent step numbers shift.
 * This function maps the "runtime" step number back to the "original" theoretical step number.
 */
function calculateOriginalStepId(
  runtimeStepId: number,
  stepChanges: StepChange[],
  beforeTime: Date,
): number {
  // Filter changes that happened before the given time
  const relevantChanges = stepChanges.filter(
    change => change.changeDate.getTime() <= beforeTime.getTime(),
  )

  // Sort by stepNo to process in order
  relevantChanges.sort((a, b) => a.stepNo - b.stepNo)

  let offset = 0

  for (const change of relevantChanges) {
    // The change affects steps at or after this position
    if (change.action === 'added') {
      // A step was added, so runtime step numbers after this point are +1 from original
      // To get original from runtime, we need to subtract 1
      if (runtimeStepId >= change.stepNo) {
        offset--
      }
    } else if (change.action === 'removed') {
      // A step was removed, so runtime step numbers after this point are -1 from original
      // To get original from runtime, we need to add 1
      if (runtimeStepId >= change.stepNo) {
        offset++
      }
    }
  }

  return runtimeStepId + offset
}

/**
 * Determines if a step at the given runtime step number was added at runtime.
 * A step is runtime-added if there's a StepChange with action='added' that,
 * when accounting for prior step changes, corresponds to this runtime step position.
 */
function isRuntimeAddedStep(
  runtimeStepNo: number,
  parallelIndex: number,
  commandNo: number,
  stepChanges: StepChange[],
  beforeTime: Date,
): boolean {
  // Filter step additions that happened before the given time
  const addedSteps = stepChanges.filter(
    change =>
      change.action === 'added'
      && change.changeDate.getTime() <= beforeTime.getTime(),
  )

  // For each added step, calculate what runtime step number it would have at beforeTime
  for (const addedStep of addedSteps) {
    // Calculate how many steps were added/removed AFTER this addition but before beforeTime
    // These affect what runtime position this added step would be at now
    let runtimePosition = addedStep.stepNo

    for (const otherChange of stepChanges) {
      // Only consider changes that happened after this addition but before beforeTime
      if (otherChange.changeDate.getTime() <= addedStep.changeDate.getTime()
        || otherChange.changeDate.getTime() > beforeTime.getTime()) {
        continue
      }

      // Changes at or before this position affect its runtime position
      if (otherChange.stepNo <= runtimePosition) {
        if (otherChange.action === 'added') {
          runtimePosition++
        } else if (otherChange.action === 'removed') {
          runtimePosition--
        }
      }
    }

    // Check if this added step matches the runtime position we're looking for
    if (runtimePosition === runtimeStepNo
      && addedStep.parallelIndex === parallelIndex
      && addedStep.commandNo === commandNo) {
      return true
    }
  }

  return false
}

/**
 * Finds the theoretical step from a program that matches the given step number.
 */
function findTheoreticalStep(
  programs: TheoreticalProgram[],
  programNo: number,
  stepId: number,
): ProgramStep | null {
  const program = programs.find(p => p.programNo === programNo)
  if (!program)
    return null

  return program.steps.find(s => s.stepId === stepId) || null
}

/**
 * Gets the theoretical command from a step based on parallel index.
 */
function getTheoreticalCommand(
  step: ProgramStep,
  parallelIndex: number,
): ProgramStepCommand | null {
  if (parallelIndex === 0) {
    return step.mainCommand
  }
  // parallelIndex - 1 because parallelIndex > 0 means it's at position (parallelIndex - 1) in array
  return step.parallelCommands[parallelIndex - 1] || null
}

/**
 * Deep clones parameters array
 */
function cloneParameters(params: Parameter[]): Parameter[] {
  return params.map(p => ({ index: p.index, value: p.value }))
}

/**
 * Deep clones IO list array
 */
function cloneIoList(ioList: IoListEntry[]): IoListEntry[] {
  return ioList.map(io => ({
    ioId: io.ioId,
    index: io.index,
    selections: io.selections.map(s => [...s] as [number, number]),
  }))
}

/**
 * Applies parameter changes to get the actual parameter values at a given time.
 *
 * The step number in parameter changes is recorded at the time of the change.
 * Due to step additions/removals, we need to convert both the actual step's stepNo
 * and the change's stepNo to their "original" theoretical step numbers to match them.
 */
function applyParameterChanges(
  baseParams: Parameter[],
  changes: ParameterChange[],
  stepChanges: StepChange[],
  programNo: number,
  actualStepNo: number,
  parallelIndex: number,
  commandNo: number,
  atTime: Date,
): Parameter[] {
  const result = cloneParameters(baseParams)

  // Convert the actual step number to original theoretical step number
  const originalActualStepId = calculateOriginalStepId(actualStepNo, stepChanges, atTime)

  // Filter relevant changes for this specific command
  // We need to convert each change's stepNo to original step number based on when the change was made
  const relevantChanges = changes.filter((c) => {
    if (c.programNo !== programNo
      || c.parallelIndex !== parallelIndex
      || c.commandNo !== commandNo
      || c.changeDate.getTime() > atTime.getTime()) {
      return false
    }

    // Convert the change's stepNo to original step id at the time the change was recorded
    const originalChangeStepId = calculateOriginalStepId(c.stepNo, stepChanges, c.changeDate)

    // Match if they refer to the same original step
    return originalChangeStepId === originalActualStepId
  })

  // Changes are already sorted by change date, apply in order
  for (const change of relevantChanges) {
    const param = result.find(p => p.index === change.parameterIndex)
    if (param) {
      param.value = Number.parseFloat(change.newValue)
    }
    // Parameter should always exist in theoretical. If not, something is wrong - skip it.
  }

  return result
}

/**
 * Applies IO selection changes to get the actual IO selections at a given time.
 *
 * The step number in IO selection changes is recorded at the time of the change.
 * Due to step additions/removals, we need to convert both the actual step's stepNo
 * and the change's stepNo to their "original" theoretical step numbers to match them.
 */
function applyIoSelectionChanges(
  baseIoList: IoListEntry[],
  changes: IoSelectionChange[],
  stepChanges: StepChange[],
  machineCommand: MachineCommand | undefined,
  programNo: number,
  actualStepNo: number,
  parallelIndex: number,
  commandNo: number,
  atTime: Date,
): IoListEntry[] {
  const result = cloneIoList(baseIoList)

  // Convert the actual step number to original theoretical step number
  const originalActualStepId = calculateOriginalStepId(actualStepNo, stepChanges, atTime)

  // Filter relevant changes for this specific command
  // We need to convert each change's stepNo to original step number based on when the change was made
  const relevantChanges = changes.filter((c) => {
    if (c.programNo !== programNo
      || c.parallelIndex !== parallelIndex
      || c.commandNo !== commandNo
      || c.changeDate.getTime() > atTime.getTime()) {
      return false
    }

    // Convert the change's stepNo to original step id at the time the change was recorded
    const originalChangeStepId = calculateOriginalStepId(c.stepNo, stepChanges, c.changeDate)

    // Match if they refer to the same original step
    return originalChangeStepId === originalActualStepId
  })

  // MachineCommand should never be undefined. If it is, something is wrong.
  // Return empty result to include in response with empty selections.
  if (!machineCommand) {
    return result
  }

  // Changes are already sorted by change date, apply in order
  for (const change of relevantChanges) {
    let ioEntry = result.find(io => io.index === change.ioIndex)

    if (!ioEntry) {
      const ioDefinition = machineCommand.ioList.find(io => io.index === change.ioIndex)
      if (!ioDefinition) {
        // IO definition not found in machine command, skip this change as it's invalid
        continue
      }
      // IO entry doesn't exist, create it
      ioEntry = { ioId: ioDefinition.ioId, index: change.ioIndex, selections: [] }
      result.push(ioEntry)
    }

    // Get the IO definition from machine command to find the type/ioId pair
    const ioDefinition = machineCommand.ioList.find(io => io.index === change.ioIndex)
    if (!ioDefinition)
      continue

    const option = ioDefinition.selections.find(s => s.index === change.ioSelectIndex)
    if (!option)
      continue

    const selectionPair: [number, number] = [option.type, option.ioId]

    if (change.newValue) {
      // Add selection if not already present
      const exists = ioEntry.selections.some(
        s => s[0] === selectionPair[0] && s[1] === selectionPair[1],
      )
      if (!exists) {
        ioEntry.selections.push(selectionPair)
      }
    } else {
      // Remove selection
      ioEntry.selections = ioEntry.selections.filter(
        s => !(s[0] === selectionPair[0] && s[1] === selectionPair[1]),
      )
    }
  }

  return result
}

/**
 * Creates a ResultCommand from theoretical and actual values.
 */
function createResultCommand(
  commandNo: number,
  theoreticalParams: Parameter[],
  actualParams: Parameter[],
  theoreticalIoList: IoListEntry[],
  actualIoList: IoListEntry[],
): ResultCommand {
  // Merge all parameter indices from both theoretical and actual
  const allParamIndices = new Set<number>([
    ...theoreticalParams.map(p => p.index),
    ...actualParams.map(p => p.index),
  ])

  const parameters = Array.from(allParamIndices).map((index) => {
    const theoretical = theoreticalParams.find(p => p.index === index)
    const actual = actualParams.find(p => p.index === index)
    return {
      index,
      theoreticalValue: theoretical?.value ?? 0,
      actualValue: actual?.value ?? theoretical?.value ?? 0,
    }
  })

  // Merge all IO indices from both theoretical and actual
  const allIoIndices = new Set<number>([
    ...theoreticalIoList.map(io => io.index),
    ...actualIoList.map(io => io.index),
  ])

  const ioList = Array.from(allIoIndices).map((index) => {
    const theoretical = theoreticalIoList.find(io => io.index === index)
    const actual = actualIoList.find(io => io.index === index)
    return {
      index,
      theoreticalSelections: theoretical?.selections ?? [],
      actualSelections: actual?.selections ?? theoretical?.selections ?? [],
    }
  })

  return {
    commandNo,
    parameters,
    ioList,
  }
}

/**
 * Main function to fetch actual steps with theoretical values at a given time.
 */
export async function fetchActualStepsWithTheoreticalValuesAtTime(
  batchKey: number,
  time: Date,
): Promise<Result> {
  const { teleskopTimezoneOffset } = useRuntimeConfig()

  // Adjust the given time to account for timezone offset, since all changes and step times are stored in database with this offset applied
  const adjustedTime = new Date(time.getTime() - teleskopTimezoneOffset * 60_000)

  // 1. Fetch batch, continue if exists
  const batch = await fetchBatch(batchKey)
  if (!batch) {
    throw new Error(`Batch ${batchKey} not found`)
  }

  // 2. Fetch machine command definitions
  const machineCommands = await fetchCommands(batch.machineId, batch.startTime)
  const machineCommandMap = new Map(machineCommands.map((c: MachineCommand) => [c.commandNo, c]))

  // 3. Fetch theoretical programs that are supposed to run in batch
  const theoreticalPrograms = await Promise.all(
    batch.programList.map(programNo =>
      fetchTheoreticalProgram(batch.machineId, programNo, batch.startTime),
    ),
  )

  // 4. Fetch actual steps running at the given time
  const actualStepsAtTime = await fetchActualStepsAtTime(batchKey, adjustedTime)

  if (actualStepsAtTime.length === 0) {
    throw new Error(`No steps running at time ${adjustedTime.toISOString()}`)
  }

  // 5. Fetch step changes
  const stepChanges = await fetchBatchStepChanges(batchKey)

  // 6. Fetch parameter and IO selection changes
  const [parameterChanges, ioSelectionChanges] = await Promise.all([
    fetchBatchParameterChanges(batchKey),
    fetchBatchIoSelectionChanges(batchKey),
  ])

  // 7. Process each running step to build the result
  // Separate main command (parallelIndex === 0) from parallel commands
  const mainActualStep = actualStepsAtTime.find(s => s.parallelIndex === 0)
  const parallelActualSteps = actualStepsAtTime.filter(s => s.parallelIndex > 0)

  if (!mainActualStep) {
    throw new Error('No main command found at the given time')
  }

  // Process main command
  // Check if this step was added at runtime (has no theoretical counterpart)
  const mainIsRuntimeAdded = isRuntimeAddedStep(
    mainActualStep.stepNo,
    0,
    mainActualStep.commandNo,
    stepChanges,
    adjustedTime,
  )

  let mainTheoreticalParams: Parameter[] = []
  let mainTheoreticalIoList: IoListEntry[] = []

  if (!mainIsRuntimeAdded) {
    // Convert the runtime step number to the original theoretical step number
    const mainOriginalStepNo = calculateOriginalStepId(
      mainActualStep.stepNo,
      stepChanges,
      adjustedTime,
    )

    const mainTheoreticalStep = findTheoreticalStep(
      theoreticalPrograms,
      mainActualStep.programNo,
      mainOriginalStepNo,
    )

    const mainTheoreticalCommand = mainTheoreticalStep
      ? getTheoreticalCommand(mainTheoreticalStep, 0)
      : null

    // Get theoretical values for main command
    mainTheoreticalParams = mainTheoreticalCommand?.parameters ?? []
    mainTheoreticalIoList = mainTheoreticalCommand?.ioList ?? []
  }
  // If step was added at runtime, theoretical values remain empty arrays

  // Apply changes to get actual values for main command
  const mainActualParams = applyParameterChanges(
    cloneParameters(mainTheoreticalParams),
    parameterChanges,
    stepChanges,
    mainActualStep.programNo,
    mainActualStep.stepNo,
    0,
    mainActualStep.commandNo,
    adjustedTime,
  )

  const mainActualIoList = applyIoSelectionChanges(
    cloneIoList(mainTheoreticalIoList),
    ioSelectionChanges,
    stepChanges,
    machineCommandMap.get(mainActualStep.commandNo),
    mainActualStep.programNo,
    mainActualStep.stepNo,
    0,
    mainActualStep.commandNo,
    adjustedTime,
  )

  const mainResultCommand = createResultCommand(
    mainActualStep.commandNo,
    mainTheoreticalParams,
    mainActualParams,
    mainTheoreticalIoList,
    mainActualIoList,
  )

  // Process parallel commands
  const parallelResultCommands: ResultCommand[] = []

  for (const parallelStep of parallelActualSteps) {
    // Check if this step was added at runtime (has no theoretical counterpart)
    const isRuntimeAdded = isRuntimeAddedStep(
      parallelStep.stepNo,
      parallelStep.parallelIndex,
      parallelStep.commandNo,
      stepChanges,
      adjustedTime,
    )

    let theoreticalParams: Parameter[] = []
    let theoreticalIoList: IoListEntry[] = []

    if (!isRuntimeAdded) {
      // Convert the runtime step number to the original theoretical step number
      const originalStepNo = calculateOriginalStepId(
        parallelStep.stepNo,
        stepChanges,
        adjustedTime,
      )

      const theoreticalStep = findTheoreticalStep(
        theoreticalPrograms,
        parallelStep.programNo,
        originalStepNo,
      )

      const theoreticalCommand = theoreticalStep
        ? getTheoreticalCommand(theoreticalStep, parallelStep.parallelIndex)
        : null

      // Get theoretical values
      theoreticalParams = theoreticalCommand?.parameters ?? []
      theoreticalIoList = theoreticalCommand?.ioList ?? []
    }
    // If step was added at runtime, theoretical values remain empty arrays

    // Apply changes to get actual values
    const actualParams = applyParameterChanges(
      cloneParameters(theoreticalParams),
      parameterChanges,
      stepChanges,
      parallelStep.programNo,
      parallelStep.stepNo,
      parallelStep.parallelIndex,
      parallelStep.commandNo,
      adjustedTime,
    )

    const actualIoList = applyIoSelectionChanges(
      cloneIoList(theoreticalIoList),
      ioSelectionChanges,
      stepChanges,
      machineCommandMap.get(parallelStep.commandNo),
      parallelStep.programNo,
      parallelStep.stepNo,
      parallelStep.parallelIndex,
      parallelStep.commandNo,
      adjustedTime,
    )

    const resultCommand = createResultCommand(
      parallelStep.commandNo,
      theoreticalParams,
      actualParams,
      theoreticalIoList,
      actualIoList,
    )

    parallelResultCommands.push(resultCommand)
  }

  return {
    mainCommand: mainResultCommand,
    parallelCommands: parallelResultCommands,
  }
}
