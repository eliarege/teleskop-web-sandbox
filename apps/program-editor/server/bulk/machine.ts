import type { Knex } from 'knex'
import type { BatchParameter, CommandFormula, CommandIO, CommandTypes, Machine, MachineCommand, MachineConstant, MachineTbbModel, TreatmentParameter } from '~/shared/types'
import type { ParameterTypeValue } from '~/shared/constants'

type RawMachine = {
  id: number
  name: string
  groupId: number
  tbbModel: MachineTbbModel
}

type RawCommand = Omit<MachineCommand, 'parameters' | 'ioList' | 'dontUseList'> & {
  dontUseList: string
}

type RawCommandParameter = {
  machineId: number
  commandNo: number
  index: number
  name: string
  group: number | null
  editable: boolean
  type: ParameterTypeValue
  format: string
  value: string
  valueIndex: number | null
  decimals: number | null
  minValue: number
  maxValue: number
  containsVariable: boolean
  useDefault: boolean
  useFormula: boolean
  selectionLabels: string | null
  selectionValues: string | null
}

type RawCommandIO = {
  machineId: number
  commandNo: number
  index: number
  physicalId: number
  type: number
  selectable: boolean
  name: string
}

type RawCommandIOSelection = {
  machineId: number
  commandNo: number
  ioIndex: number
  index: number
  type: number
  name: string
  defaultValue: boolean
  physicalId: number
}

export async function fetchAllMachines(db: Knex): Promise<Machine[]> {
  const rawMachines = await fetchRawMachines(db)
  if (rawMachines.length === 0)
    return []

  const machineIds = rawMachines.map(m => m.id)

  const [
    rawCommands,
    rawCommandParameters,
    rawCommandIOs,
    rawCommandIOSelections,
    rawBatchParameters,
    rawMachineConstants,
    rawCommandFormulas,
    rawTreatmentParameters,
    rawCommandTypeMappings,
  ] = await Promise.all([
    fetchRawCommands(db, machineIds),
    fetchRawCommandParameters(db, machineIds),
    fetchRawCommandIOs(db, machineIds),
    fetchRawCommandIOSelections(db, machineIds),
    fetchRawBatchParameters(db, machineIds),
    fetchRawMachineConstants(db, machineIds),
    fetchRawCommandFormulas(db, machineIds),
    fetchRawTreatmentParameters(db, machineIds),
    fetchRawCommandTypeMappings(db, machineIds),
  ])

  const machines: Machine[] = []

  let cmdCursor = 0
  let parCursor = 0
  let iosCursor = 0
  let selCursor = 0
  let batchCursor = 0
  let constCursor = 0
  let formulaCursor = 0
  let treatmentCursor = 0
  let cmdTypeCursor = 0

  for (const rawMachine of rawMachines) {
    const commands: MachineCommand[] = []

    for (; cmdCursor < rawCommands.length; cmdCursor++) {
      const rawCommand = rawCommands[cmdCursor]
      if (rawCommand.machineId !== rawMachine.id)
        break

      const command: MachineCommand = {
        machineId: rawCommand.machineId,
        commandNo: rawCommand.commandNo,
        name: rawCommand.name,
        icon: rawCommand.icon,
        activated: rawCommand.activated,
        adviceList: rawCommand.adviceList,
        dontUseList: String(rawCommand.dontUseList)
          .split(',')
          .map(num => Number(num.trim()))
          .filter(Number.isFinite),
        isRunManual: rawCommand.isRunManual,
        commandType: rawCommand.commandType,
        moveParallel: rawCommand.moveParallel,
        x: rawCommand.x,
        y: rawCommand.y,
        a: rawCommand.a,
        maxA: rawCommand.maxA,
        b: rawCommand.b,
        isTemperature: rawCommand.isTemperature,
        isUnload: rawCommand.isUnload,
        parameters: [],
        ioList: [],
      }

      for (; parCursor < rawCommandParameters.length; parCursor++) {
        const rawParameter = rawCommandParameters[parCursor]
        if (rawParameter.machineId !== rawMachine.id || rawParameter.commandNo !== command.commandNo)
          break

        const selectionLabels = rawParameter.selectionLabels?.trim().slice(1, -1).split('" "') || [] as string[]
        const selectionValues = rawParameter.selectionValues?.trim().slice(1, -1).split('" "').map(Number) || [] as number[]
        const selectionLength = Math.min(selectionLabels.length, selectionValues.length)
        const selections = Array.from({ length: selectionLength }, (_, i) => {
          return {
            name: selectionLabels[i],
            value: selectionValues[i],
          }
        })

        command.parameters.push({
          index: rawParameter.index,
          name: rawParameter.name,
          group: rawParameter.group,
          editable: rawParameter.editable,
          type: rawParameter.type,
          format: rawParameter.format,
          value: rawParameter.value,
          decimals: rawParameter.decimals,
          valueIndex: rawParameter.valueIndex,
          minValue: rawParameter.minValue,
          maxValue: rawParameter.maxValue,
          containsVariable: rawParameter.containsVariable,
          useDefault: rawParameter.useDefault,
          useFormula: rawParameter.useFormula,
          selections,
        })
      }

      for (; iosCursor < rawCommandIOs.length; iosCursor++) {
        const rawIo = rawCommandIOs[iosCursor]
        if (rawIo.machineId !== rawMachine.id || rawIo.commandNo !== command.commandNo)
          break

        const currentIo: CommandIO = {
          index: rawIo.index,
          physicalId: rawIo.physicalId,
          type: rawIo.type,
          selectable: rawIo.selectable,
          name: rawIo.name,
          selections: [],
        }
        command.ioList.push(currentIo)

        for (; selCursor < rawCommandIOSelections.length; selCursor++) {
          const rawIoSelection = rawCommandIOSelections[selCursor]
          if (rawIoSelection.machineId !== rawMachine.id || rawIoSelection.ioIndex !== rawIo.index || rawIoSelection.commandNo !== rawIo.commandNo)
            break

          currentIo.selections.push({
            index: rawIoSelection.index,
            type: rawIoSelection.type,
            name: rawIoSelection.name,
            defaultValue: rawIoSelection.defaultValue,
            physicalId: rawIoSelection.physicalId,
          })
        }
      }

      commands.push(command)
    }

    const batchParameters: BatchParameter[] = []
    for (; batchCursor < rawBatchParameters.length; batchCursor++) {
      const r = rawBatchParameters[batchCursor]
      if (r.machineId !== rawMachine.id)
        break
      batchParameters.push(r)
    }

    const constants: MachineConstant[] = []
    for (; constCursor < rawMachineConstants.length; constCursor++) {
      const r = rawMachineConstants[constCursor]
      if (r.machineId !== rawMachine.id)
        break
      constants.push(r)
    }

    const commandFormulas: CommandFormula[] = []
    for (; formulaCursor < rawCommandFormulas.length; formulaCursor++) {
      const r = rawCommandFormulas[formulaCursor]
      if (r.machineId !== rawMachine.id)
        break
      commandFormulas.push(r)
    }

    const treatmentParameters: TreatmentParameter[] = []
    for (; treatmentCursor < rawTreatmentParameters.length; treatmentCursor++) {
      const r = rawTreatmentParameters[treatmentCursor]
      if (r.machineId !== rawMachine.id)
        break
      const { machineId: _machineId, ...treatmentParameter } = r
      treatmentParameters.push(treatmentParameter)
    }

    const commandTypes: CommandTypes[] = []
    for (; cmdTypeCursor < rawCommandTypeMappings.length; cmdTypeCursor++) {
      const r = rawCommandTypeMappings[cmdTypeCursor]
      if (r.machineId !== rawMachine.id)
        break
      const { machineId: _machineId, ...commandType } = r
      commandTypes.push(commandType)
    }
    const commandMap = new Map<number, MachineCommand>()
    for (const command of commands) {
      commandMap.set(command.commandNo, command)
    }
    machines.push({
      id: rawMachine.id,
      name: rawMachine.name,
      groupId: rawMachine.groupId,
      tbbModel: rawMachine.tbbModel,
      commands: commandMap,
      constants,
      commandFormulas,
      batchParameters,
      treatmentParameters,
      commandTypes,
    })
  }

  return machines
}

async function fetchRawMachines(db: Knex): Promise<RawMachine[]> {
  return await db
    .select({
      id: 'MACHINEID',
      name: 'MACHINECODE',
      groupId: 'GRUPNO',
      tbbModel: 'TBBMODEL',
    })
    .from('BFMACHINES')
    .where('USEINTELESKOP', 1)
    .andWhere('INUSE', 1)
    .orderBy('MACHINEID') as RawMachine[]
}

async function fetchRawCommands(db: Knex, machineIds: number[]): Promise<RawCommand[]> {
  return await db
    .from('BFMASTERCOMMANDS')
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
    })
    .whereIn('MACHINEID', machineIds)
    .andWhere('ACTIVATED', 1)
    .orderBy(['MACHINEID', 'COMMANDNO']) as RawCommand[]
}

async function fetchRawCommandParameters(db: Knex, machineIds: number[]): Promise<RawCommandParameter[]> {
  return await db
    .from('BFCOMMANDPARAMETERS as P')
    .join('BFMASTERCOMMANDS as C', function () {
      this.on('P.MACHINEID', '=', 'C.MACHINEID')
        .andOn('P.COMMANDNO', '=', 'C.COMMANDNO')
    })
    .select({
      machineId: 'P.MACHINEID',
      commandNo: 'P.COMMANDNO',
      index: 'P.PARAMETERINDEX',
      name: 'P.PARAMSTRING',
      group: 'P.PARAMETERGROUP',
      editable: 'P.PROGRAMEDITING',
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
      decimals: 'P.DECIMALS',
      minValue: 'P.PARAMLOWLIMIT',
      maxValue: 'P.PARAMHIGHLIMIT',
      containsVariable: 'P.CONTAINSVARIABLE',
      useDefault: 'P.USEDEFAULT',
      useFormula: 'P.USEFORMULA',
      selectionLabels: db.raw(`NULLIF(P.SELECTIONLIST, '')`),
      selectionValues: db.raw(`NULLIF(P.SELECTIONVALUES, '')`),
    })
    .whereIn('P.MACHINEID', machineIds)
    .andWhere('C.ACTIVATED', 1)
    .orderBy(['P.MACHINEID', 'P.COMMANDNO', 'P.PARAMETERINDEX']) as RawCommandParameter[]
}

async function fetchRawCommandIOs(db: Knex, machineIds: number[]): Promise<RawCommandIO[]> {
  return await db
    .from('BFCOMMANDINPUTOUTPUTS as IO')
    .join('BFMASTERCOMMANDS as C', function () {
      this.on('IO.MACHINEID', '=', 'C.MACHINEID')
        .andOn('IO.COMMANDNO', '=', 'C.COMMANDNO')
    })
    .select({
      machineId: 'IO.MACHINEID',
      commandNo: 'IO.COMMANDNO',
      index: 'IO.IOINDEX',
      physicalId: 'IO.IOID',
      type: db.raw('IO.IOTYPE'),
      selectable: db.raw(`CAST(CASE IO.IOTYPE WHEN 5 THEN 1 ELSE 0 END as bit)`),
      name: 'IO.NAME',
    })
    .whereIn('IO.MACHINEID', machineIds)
    .andWhere('C.ACTIVATED', 1)
    .orderBy(['IO.MACHINEID', 'IO.COMMANDNO', 'IO.IOINDEX']) as RawCommandIO[]
}

async function fetchRawCommandIOSelections(db: Knex, machineIds: number[]): Promise<RawCommandIOSelection[]> {
  return await db
    .from('BFCOMMANDSELECTIONLIST as S')
    .join('BFCOMMANDINPUTOUTPUTS as IO', function () {
      this.on('S.MACHINEID', '=', 'IO.MACHINEID')
        .andOn('S.COMMANDNO', '=', 'IO.COMMANDNO')
        .andOn('S.IOINDEX', '=', 'IO.IOINDEX')
    })
    .join('BFMASTERCOMMANDS as C', function () {
      this.on('IO.MACHINEID', '=', 'C.MACHINEID')
        .andOn('IO.COMMANDNO', '=', 'C.COMMANDNO')
    })
    .select({
      machineId: 'S.MACHINEID',
      commandNo: 'S.COMMANDNO',
      ioIndex: 'S.IOINDEX',
      index: 'S.SELECTINDEX',
      type: db.raw('S.IOTYPE + 1'),
      name: 'S.NAME',
      defaultValue: 'S.ISDEFAULT',
      physicalId: 'S.IOID',
    })
    .whereIn('S.MACHINEID', machineIds)
    .andWhere('C.ACTIVATED', 1)
    .orderBy(['S.MACHINEID', 'S.COMMANDNO', 'S.IOINDEX', 'S.SELECTINDEX']) as RawCommandIOSelection[]
}

async function fetchRawBatchParameters(db: Knex, machineIds: number[]): Promise<BatchParameter[]> {
  return await db('BFMACHBATCHPARAMETERS')
    .select({
      batchParameterId: 'BATCHPARAMETERID',
      machineId: 'MACHINEID',
      paramString: 'PARAMSTRING',
      paramLowLimit: 'PARAMLOWLIMIT',
      paramHighLimit: 'PARAMHIGHLIMIT',
      batchPlanning: 'BATCHPLANNING',
      batchStart: 'BATCHSTART',
      recipe: 'RECIPE',
      defaultValue: 'DEFAULTVALUE',
      parameterType: 'PARAMETERTYPE',
      selectionList: 'SELECTIONLIST',
      unitCode: 'UNITCODE',
      selectionValues: 'SELECTIONVALUES',
      isDeleted: 'ISDELETED',
      tbbChangeTime: 'TBBCHANGETIME',
      changeTime: 'CHANGETIME',
      format: 'FORMAT',
      parameterId: 'PARAMETERID',
      unitText: 'UNITTEXT',
      paramStringEn: 'PARAMSTRINGEN',
      selectionListDefault: 'SELECTIONLISTDEFAULT',
    })
    .whereIn('MACHINEID', machineIds)
    .orderBy('MACHINEID') as BatchParameter[]
}

async function fetchRawMachineConstants(db: Knex, machineIds: number[]): Promise<MachineConstant[]> {
  return await db('BFMACHPARAMETERS')
    .select({
      machineParameterId: 'MACHINEPARAMETERID',
      machineId: 'MACHINEID',
      paramString: 'PARAMSTRING',
      paramLowLimit: 'PARAMLOWLIMIT',
      paramHighLimit: 'PARAMHIGHLIMIT',
      paramType: 'PARAMETERTYPE',
      selectionList: 'SELECTIONLIST',
      unitCode: 'UNITCODE',
      selectionValues: 'SELECTIONVALUES',
      isDeleted: 'ISDELETED',
      tbbChangeTime: 'TBBCHANGETIME',
      changeTime: 'CHANGETIME',
      defaultValue: 'DEFAULTVALUE',
      dmArea: 'dmArea',
      consScreen: 'consScreen',
      consFormat: 'consFormat',
      consUnit: 'consUnit',
      currentValue: 'currentValue',
    })
    .whereIn('MACHINEID', machineIds)
    .orderBy('MACHINEID') as MachineConstant[]
}

async function fetchRawCommandFormulas(db: Knex, machineIds: number[]): Promise<CommandFormula[]> {
  return await db('BFCOMMANDFORMULAS')
    .select(
      'machineId',
      'formulaId',
      'formula',
      'commandNo',
      'commandParameterNo',
      'formulaName',
    )
    .whereIn('machineId', machineIds)
    .orderBy('machineId') as CommandFormula[]
}

async function fetchRawTreatmentParameters(db: Knex, machineIds: number[]): Promise<(TreatmentParameter & { machineId: number })[]> {
  return await db('BFTREATMENTPARAMGROUPMAP as PGM')
    .select({
      machineId: 'MG.MACHINEID',
      paramId: 'PGM.PARAMID',
      paramName: 'PT.TREATMENTPARAMETER',
      groupId: 'PGM.GROUPID',
      commandNo: 'PGM.COMMANDNO',
      parameterIndex: 'PGM.PARAMETERINDEX',
    })
    .join('BFTREATMENTPARAMETERGROUPMACHINES as MG', 'PGM.GROUPID', 'MG.GROUPID')
    .join('BFTREATMENTPARAMETERS as PT', 'PT.ID', 'PGM.PARAMID')
    .whereIn('MG.MACHINEID', machineIds)
    .orderBy('MG.MACHINEID') as (TreatmentParameter & { machineId: number })[]
}

async function fetchRawCommandTypeMappings(db: Knex, machineIds: number[]): Promise<(CommandTypes & { machineId: number })[]> {
  return await db('BFCOMMANDTYPES as CT')
    .select({
      machineId: 'CT.machineId',
      commandType: 'CT.commandType',
      commandNo: 'CT.commandNo',
    })
    .whereIn('CT.machineId', machineIds)
    .orderBy('CT.machineId') as (CommandTypes & { machineId: number })[]
}
