import type { Knex } from 'knex'
import type { CalibrationAnalogInput, LockOutputAnalog, LockOutputDigital, TbbFtpClient } from '@teleskop/tbb-ftp-client'
import { chunk } from 'lodash-es'
import { insertBatch } from '@teleskop/utils'
import { DatabaseQueryError } from '../error'
import { calcIONumber, getIONames } from '.'
import type { CommandAlarmReason, FunctionAlarm } from '~/types'

async function replaceRecords(knex: Knex, tableName: string, data: any[], whereObject?: Record<string, any>): Promise<boolean> {
  const chunks = chunk(data, 50)
  const delQuery = knex(tableName).del()
  if (whereObject)
    delQuery.where(whereObject)

  const insertQuery = knex(tableName)

  try {
    await delQuery
    for (const chunk of chunks) {
      await insertQuery.insert(chunk)
    }
    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

async function insertIgnoringDuplicates(trx: Knex, tableName: string, data: any[], uniqueColumns: string[]) {
  for (const item of data) {
    const exists = await trx(tableName)
      .select('*')
      .where(uniqueColumns.reduce((acc, col) => ({ ...acc, [col]: item[col] }), {}))
      .first()

    if (!exists) {
      await trx(tableName).insert(item)
    }
  }
  return true
}

export async function updateAnalogInputs(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  try {
    const inputs = await tbb.fetchAnalogInputs()
    if (!inputs.length)
      return false

    const controllerModel = await tbb.fetchControllerModel()
    const calibrations: CalibrationAnalogInput[] = await tbb.fetchCalibrationAnalogInput()
    const analogInputs = inputs?.map((d) => {
      const calib = calibrations.find(c => c.id === d.id)
      const calibMaxValue = calib?.calibType === 0
        ? 150
        : Math.max(...(calib?.measureValues?.map(m => m.value) ?? [0])) * 1.2
      return {
        MACHINEID: machineId,
        ID: calcIONumber(d, controllerModel, 'analog input'),
        CARD: d.card,
        CANAL: d.channel,
        NAME: d.name,
        ENABLED: d.enabled,
        ISDELETED: false,
        CALIBTYPE: calib?.calibType ?? 0,
        CALIBMAXVALUE: calibMaxValue,
        CALIBUNIT: calib?.unit,
      }
    })

    return await replaceRecords(trx, 'BFMACHAIN', analogInputs, { MACHINEID: machineId })
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

export async function updateAnalogOutputs(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const outputs = await tbb.fetchAnalogOutputs()
  if (!outputs.length)
    return false
  const controllerModel = await tbb.fetchControllerModel()
  const analogOutputs = outputs?.map(d => ({
    MACHINEID: machineId,
    ID: calcIONumber(d, controllerModel, 'analog output'),
    CARD: d.card,
    CANAL: d.channel,
    NAME: d.name,
    ENABLED: d.enabled,
    DEFAULTVALUE: d.defaultValue,
    ISDELETED: false,
  }))

  return await replaceRecords(trx, 'BFMACHAOUT', analogOutputs, { MACHINEID: machineId })
}

export async function updateDigitalInputs(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const inputs = await tbb.fetchDigitalInputs()
  if (!inputs.length)
    return false
  const controllerModel = await tbb.fetchControllerModel()
  const digitalInputs = inputs?.map(d => ({
    MACHINEID: machineId,
    ID: calcIONumber(d, controllerModel, 'digital input'),
    CARD: d.card,
    CANAL: d.channel,
    NAME: d.name,
    ENABLED: d.enabled,
    ISDELETED: false,
  }))

  return await replaceRecords(trx, 'BFMACHDIN', digitalInputs, { MACHINEID: machineId })
}

export async function updateDigitalOutputs(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const outputs = await tbb.fetchDigitalOutputs()
  if (!outputs.length)
    return false
  const controllerModel = await tbb.fetchControllerModel()
  const digitalOutputs = outputs?.map(d => ({
    MACHINEID: machineId,
    ID: calcIONumber(d, controllerModel, 'digital output'),
    CARD: d.card,
    CANAL: d.channel,
    NAME: d.name,
    ENABLED: d.enabled,
    ISDELETED: false,
    DEFAULTVALUE: d.defaultValue,
  }))

  return await replaceRecords(trx, 'BFMACHDOUT', digitalOutputs, { MACHINEID: machineId })
}

export async function updateCounters(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const counters = await tbb.fetchCounters()
  if (!counters.length)
    return false

  const controllerModel = await tbb.fetchControllerModel()
  const calibCounters = await tbb.fetchCalibrationCounters()

  const data = counters?.map(d => ({
    MACHINEID: machineId,
    ID: calcIONumber(d, controllerModel, 'counter'),
    CARD: d.card,
    CANAL: d.channel,
    NAME: d.name,
    ENABLED: d.enabled,
    ISDELETED: false,
    CALIBUNIT: calibCounters.find(c => c.id === d.id)?.unit ?? '',
  }))

  return await replaceRecords(trx, 'BFMACHCOUNTER', data, { MACHINEID: machineId })
}

export async function updateFinishReasons(tbb: TbbFtpClient, trx: Knex) {
  const finishReasons = await tbb.fetchFinishReasons()
  if (!finishReasons.length)
    return false
  return await replaceRecords(trx, 'BFDYLOTFINISHREASONS', finishReasons)
}

// used in project load only
export async function updateManualReasons(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const manualReasons = await tbb.fetchManualReasons()
  if (!manualReasons)
    return false
  const data = manualReasons.map((d) => {
    return {
      MACHINEID: machineId,
      MANUALCODE: d.manualCode,
      MANUALNAME: d.manualName,
    }
  })
  return await replaceRecords(trx, 'BFMANUALREASONS', data, { MACHINEID: machineId })
}

// used in download dye house definitions only
export async function updateManualReasonsGeneral(tbb: TbbFtpClient, trx: Knex) {
  const manualReasons = await tbb.fetchManualReasons()
  if (!manualReasons)
    return false

  const data = manualReasons.map((d) => {
    return {
      manualID: d.manualCode,
      manualString: d.manualName,
    }
  })

  return await replaceRecords(trx, 'BFMANUALREASONSGENERAL', data)
}

export async function updateStopReasons(tbb: TbbFtpClient, trx: Knex) {
  const stopReasons = await tbb.fetchStopReasons()
  if (!stopReasons.length)
    return false
  return await replaceRecords(trx, 'BFSTOPREASONS', stopReasons)
}

export async function updateMachineController(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const { productModel, hardwareModel, plcModel } = await tbb.fetchControllerModel()
  if (!productModel && !hardwareModel && !plcModel)
    return false
  const updateQuery = trx('BFMACHINES').where('MACHINEID', machineId).update({
    productModel,
    hardwareModel,
    plcModel,
  })
  try {
    await updateQuery
    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

export async function updateCommandGroups(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandGroups()
  if (!commands.length)
    return false
  const data = commands.map((d) => {
    return {
      COMMANDGROUPID: d.commandGroupId,
      NAME: d.name,
      ICON: d.icon,
      MACHINEID: machineId,
    }
  })
  return await replaceRecords(trx, 'BFCOMMANDGROUP', data, { MACHINEID: machineId })
}

export async function updateIOChangedEvent(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const inputs = await tbb.fetchIOChangedEvent()
  if (!inputs.length)
    return false
  const data = inputs.map((d) => {
    const period = (d.ioType === 1 || d.ioType === 2) ? d.period : 0
    const processed = (d.ioType === 1 || d.ioType === 2) ? true : d.difference === 1

    return {
      MACHINEID: machineId,
      IOID: d.ioType,
      IOINDEX: d.ioIndex,
      DIFFERENCE: d.difference,
      PERIOD: period,
      PROCESSED: processed,
    }
  })

  return await replaceRecords(trx, 'BFIOCHANGEDEVENT', data, { MACHINEID: machineId })
}

export async function updateUsers(tbb: TbbFtpClient, trx: Knex) {
  const users = await tbb.fetchUsers()
  if (!users.length)
    return false
  const data = users.map((d) => {
    return {
      userID: d.userId,
      userPass: d.userPass,
      userName: d.userName,
      userSurname: d.userSurname,
      userMode: d.userMode,
      userMode2: d.userMode2,
      userType: d.userType,
    }
  })
  return await replaceRecords(trx, 'BFUSERS', data)
}

export async function updateCommandsGeneral(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandsGeneral()
  if (!commands.length)
    return false

  const machineConstants = await trx('BFMACHPARAMETERS')
    .select({
      id: 'MACHINEPARAMETERID',
      currentValue: 'currentValue',
    })
    .where('MACHINEID', machineId)

  const data = commands.map((d) => {
    let activated = d.activated
    if (d.activated === 1 && d.machineConstantId !== -1) {
      const constant = machineConstants.find(con => con.id === d.machineConstantId)
      if (constant?.currentValue === 0) {
        activated = 0
      }
    }

    return {
      COMMANDNO: d.commandNo,
      NAME: d.name,
      TBBFUNTIONNAME: d.tbbFunctionName,
      ICON: d.icon,
      COMMANDTYPE: d.commandType,
      ISRUNMANUAL: d.isRunManual,
      MOVEPARALLEL: d.moveParallel,
      GROUPID: d.groupId,
      MACHINEID: machineId,
      ACTIVATED: activated,
      ISDELETED: 0,
      ISCHANGED: 1,
      FUNCTIONID: 0,
      CHANGETIME: trx.fn.now(),
      TBBCHANGETIME: trx.fn.now(),
    }
  })

  return await replaceRecords(trx, 'BFMASTERCOMMANDS', data, { MACHINEID: machineId })
}

export async function updateCommandGraphic(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandGraphic()
  if (!commands.length)
    return false

  try {
    for (const c of commands) {
      await trx('BFMASTERCOMMANDS').where({
        COMMANDNO: c.commandNo,
        MACHINEID: machineId,
      }).update({
        ISTEMPERATURE: !!((c.type === 2 || c.type === 6)),
        ISUNLOAD: !!((c.type === 4 || c.type === 6)),
        X: c.x,
        Y: c.y,
        A: c.a,
        MAXA: c.maxA,
        B: c.b,
      })
    }
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

export async function updateMachineParameters(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const parameters = await tbb.fetchMachineParameters()
  if (!parameters.length)
    return false

  const paramValues = await tbb.fetchMachineParameterValues()

  const machineParameters = parameters?.map(d => ({
    MACHINEID: machineId,
    MACHINEPARAMETERID: d.machineParameterId,
    PARAMSTRING: d.paramString,
    DEFAULTVALUE: d.defaultValue,
    dmArea: d.dmArea,
    consScreen: d.consScreen,
    PARAMLOWLIMIT: d.paramLowLimit,
    PARAMHIGHLIMIT: d.paramHighLimit,
    consFormat: d.consFormat,
    consUnit: d.consUnit,
    currentValue: paramValues.find(p => p.machineParameterId === d.machineParameterId)?.currentValue,
  }))

  return await replaceRecords(trx, 'BFMACHPARAMETERS', machineParameters, { MACHINEID: machineId })
}

export async function updateCommandEditing(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandsEditing()
  if (!commands.length)
    return false

  try {
    for (const command of commands) {
      await trx('BFMASTERCOMMANDS').where({
        COMMANDNO: command.commandNo,
        MACHINEID: machineId,
      }).update({
        ADVICELIST: command.adviceList ? command.adviceList : -1,
        DONTUSELIST: command.dontUseList,
      })
    }
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

export async function updateCommandFeedback(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commandFeedback = await tbb.fetchCommandFeedback()
  if (!commandFeedback.length)
    return false
  const data = commandFeedback?.map(c => ({
    MACHINEID: machineId,
    COMMANDNO: c.commandNo,
    RETURNVALUEINDEX: Number.parseInt(c.pvNo.split(' ')[1]) - 1,
    RETURNVALUENAME: c.returnValueName,
    CANSHOW: c.canShow,
    SPRELATION: c.SPRelation - 1,
  }))

  return await replaceRecords(trx, 'BFMASTERCOMMANDRETURNVALUES', data, { MACHINEID: machineId })
}

export async function updateConsumption(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const consumption = await tbb.fetchConsumption()
  if (!consumption)
    return false
  const query = trx('BFMACHINES')
    .where('MACHINEID', machineId)
    .update({
      WATERCOUNTERID: consumption.SU_SAYACI,
      ELECTRICITYCOUNTERID: consumption.ELEKTRIK_SAYACI,
      WATERTYPE_0_DO: consumption.WATERTYPE_0_DO,
      WATERTYPE_1_DO: consumption.WATERTYPE_1_DO,
      WATERTYPE_2_DO: consumption.WATERTYPE_2_DO,
      WATERTYPE_3_DO: consumption.WATERTYPE_3_DO,
      WATERTYPE_4_DO: consumption.WATERTYPE_4_DO,
      WATERTYPE_5_DO: consumption.WATERTYPE_5_DO,
      WATERTYPE_6_DO: consumption.WATERTYPE_6_DO,
    })
  try {
    await query
    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

export async function updateGlobalCommandFormulas(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const formulas = await tbb.fetchGlobalCommandFormulas()
  if (!formulas.length)
    return false
  const data = formulas.map((d) => {
    return {
      machineId,
      ...d,
    }
  })
  return await replaceRecords(trx, 'BFCOMMANDFORMULAS', data, { machineId })
}

export async function updateCommandParameters(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandParams()
  const formulas = await tbb.fetchGlobalCommandFormulas()
  if (!commands.length && !formulas.length)
    return false

  const data = commands.map((c) => {
    const globalCommandFormula = formulas.findIndex(f => f.commandNo === c.commandNo)

    return {
      MACHINEID: machineId,
      COMMANDNO: c.commandNo,
      PARAMSTRING: c.paramName,
      COMMANDDEFINITION: false,
      PROGRAMEDITING: c.binding === 1,
      BATCHPLANNING: false,
      BATCHSTART: c.binding === 2,
      COMMANDRUN: false,
      RECIPE: false,
      VALUE: c.paramFormula ? c.paramFormula : (c.defaultValue).toString(),
      PARAMETERTYPE: (c.selectionList?.length || globalCommandFormula !== -1) ? 1 : 0,
      SELECTIONLIST: c.selectionList?.length ? c.selectionList.map(d => `"${d.name}"`).join(' ') : '',
      SELECTIONVALUES: c.selectionList?.length ? c.selectionList.map(d => `"${d.value}"`).join(' ') : '',
      UNITCODE: 0,
      PARAMLOWLIMIT: c.minValue,
      PARAMHIGHLIMIT: c.maxValue,
      CONTAINSVARIABLE: !!c.paramFormula,
      TEMPERATURE: c.graphic,
      USEDEFAULT: c.binding === 2 || c.binding === 3,
      ISCOMMANDVARIABLE: false,
      TBBFORMUL: !!c.paramFormula,
      USEFORMULA: c.binding === 5,
      PARAMETERINDEX: Number.parseInt(c.name.split(' ')[1]) - 1,
    }
  })

  return await replaceRecords(trx, 'BFCOMMANDPARAMETERS', data, { MACHINEID: machineId })
}

export async function updateCommandAlarmReasons(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commandAlarmReasons = await tbb.fetchCommandAlarmReasons()
  if (!commandAlarmReasons.length)
    return false
  const timeoutReasons = commandAlarmReasons.map(r => ({
    REASONTEXT: r.reasonText,
    GROUPID: r.groupId,
  }))

  const commandMapEntries = commandAlarmReasons.flatMap(reason =>
    reason.commandNumbers.map(commandNo => ({
      REASONID: reason.id,
      MACHINEID: machineId,
      COMMANDNO: commandNo,
    })),
  )

  try {
    await trx('BFCOMMANDTIMEOUTREASONMAP').where('MACHINEID', machineId).del()
    await insertIgnoringDuplicates(trx, 'BFCOMMANDTIMEOUTREASONS', timeoutReasons, ['REASONTEXT', 'GROUPID'])

    await trx('BFCOMMANDTIMEOUTREASONMAP').insert(commandMapEntries)
    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

export async function updateCommandAlarms(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandAlarms()
  const functionAlarms = await tbb.fetchFunctionAlarms()
  if (!commands.length && !functionAlarms.length)
    return false

  const commandsAlarmsInserts = []

  for (const c of commands) {
    const [functionNameRow] = await trx('BFMASTERCOMMANDS')
      .where({
        MACHINEID: machineId,
        COMMANDNO: c.commandNo,
      })
      .select('TBBFUNTIONNAME')

    const functionName = functionNameRow?.TBBFUNTIONNAME
    const alarmObj = functionAlarms.find(a => a.f === functionName)
    let alarmTypeIndex = null as number | null

    if (alarmObj) {
      const alarmType = Object.keys(alarmObj)
        .find(key => alarmObj[key as keyof FunctionAlarm]?.includes(String(c.alarmNo)))

      switch (alarmType) {
        case 's':
          alarmTypeIndex = 0
          break
        case 'e':
          alarmTypeIndex = 1
          break
        case 'o':
          alarmTypeIndex = 2
          break
        case 'm':
          alarmTypeIndex = 3
          break
      }
    }

    commandsAlarmsInserts.push({
      MACHINEID: machineId,
      ALARMINDEX: c.alarmNo,
      COMMANDNO: c.commandNo,
      ALARMNO: c.alarmNo,
      UNIVERSALALARMNO: c.alarmNo,
      ALARM: c.alarm,
      ALARMTYPE: alarmTypeIndex,
    })
  }

  return await replaceRecords(trx, 'BFMASTERCOMMANDSALARMS', commandsAlarmsInserts, { MACHINEID: machineId })
}

export async function updateCommandIO(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandIO()
  if (!commands.length)
    return false

  const inputsOutputs = []
  const selectionList = []

  const ioNames = await getIONames(machineId, trx)

  for (const [_index, command] of commands.entries()) {
    for (const [_i, c] of command.chooseList.entries()) {
      const commonData = {
        IOINDEX: c.ioIndex,
        MACHINEID: machineId,
        COMMANDNO: command.commandNo,
        IOID: c.ioId,
      }
      const ioName = ioNames[c.ioType - 1]?.find(d => d.id === c.ioId)?.name || ''

      if (c.selectIndex === 0) {
        inputsOutputs.push({
          ...commonData,
          NAME: c.name.length ? c.name : ioName,
          IOTYPE: c.isChoosableIO ? 5 : c.ioType - 1,
          PROGRAMEDITING: false,
          COMMANDRUN: false,
        })
      }

      selectionList.push({
        ...commonData,
        SELECTINDEX: c.selectIndex,
        IOTYPE: c.ioType - 1,
        NAME: ioName,
        SELECTEDIOID: c.ioId,
        ISDEFAULT: c.isDefault,
        MODEL: 'MODEL',
        EXTENTION: 'EXTENSION',
      })
    }
  }
  try {
    await replaceRecords(trx, 'BFCOMMANDINPUTOUTPUTS', inputsOutputs, { MACHINEID: machineId })
    await replaceRecords(trx, 'BFCOMMANDSELECTIONLIST', selectionList, { MACHINEID: machineId })

    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

export async function updateLocksInput(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const locks = await tbb.fetchLocksInput()
  if (!locks.length)
    return false
  const analogInputs = locks.filter(d => d.inputType === 0)
  const analogInputsDB = analogInputs.flatMap(d =>
    d.inputs.map((input, index) => ({
      MACHINEID: machineId,
      LOCKNO: d.lockId,
      LOCKAININDEX: index,
      ID: input.id,
      R1MIN: input.r1min,
      R2MAX: input.r2max,
      HISTERISIS: input.histerisis,
      STATE: input.state,
    })),
  )

  const digitalInputs = locks.filter(d => d.inputType === 1)
  const digitalInputsDB = digitalInputs.flatMap(d =>
    d.inputs.map((input, index) => ({
      MACHINEID: machineId,
      LOCKNO: d.lockId,
      LOCKDININDEX: index,
      ID: input.id,
      STATE: input.state,
    })),
  )

  const digitalOutputs = locks.filter(d => d.inputType === 7)
  const digitalOutputsDB = digitalOutputs.flatMap(d =>
    d.inputs.map((input, index) => ({
      MACHINEID: machineId,
      LOCKNO: d.lockId,
      LOCKDOUTINDEX: index,
      ID: input.id,
      STATE: input.state,
    })),
  )

  const commands = locks.filter(d => d.inputType === 4)
  const commandsDB = commands.flatMap(d =>
    d.inputs.map((input, index) => ({
      MACHINEID: machineId,
      LOCKNO: d.lockId,
      COMMANDINDEX: index,
      COMMANDNO: input.id,
      STATE: input.state,
    })),
  )

  const locksInput = locks.filter(d => d.inputType === 5)
  const locksInputDB = locksInput.flatMap(d =>
    d.inputs.map((input, index) => ({
      MACHINEID: machineId,
      LOCKNO: d.lockId,
      LOCKLOCKINDEX: index,
      OTHERLOCKNO: input.id,
      STATE: input.state,
    })),
  )

  const virtualInputs = locks.filter(d => d.inputType === 8)
  const virtualInputsDB = virtualInputs.flatMap(d =>
    d.inputs.map((input, index) => ({
      MACHINEID: machineId,
      LOCKNO: d.lockId,
      LOCKDININDEX: index,
      ID: input.id,
      TRIGGER: input.state,
    })),
  )
  try {
    await replaceRecords(trx, 'BFLOCKSINPUTAIN', analogInputsDB, { MACHINEID: machineId })
    await replaceRecords(trx, 'BFLOCKSINPUTDIN', digitalInputsDB, { MACHINEID: machineId })
    await replaceRecords(trx, 'BFLOCKSINPUTDOUT', digitalOutputsDB, { MACHINEID: machineId })
    await replaceRecords(trx, 'BFLOCKSINPUTCOMMAND', commandsDB, { MACHINEID: machineId })
    await replaceRecords(trx, 'BFLOCKSINPUTKILIT', locksInputDB, { MACHINEID: machineId })
    await replaceRecords(trx, 'BFLOCKSINPUTVIN', virtualInputsDB, { MACHINEID: machineId })

    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

// TODO: can be optimized
/**
 * 0: analog input
 * 1: digital input
 * 4: command
 * 5: lock
 * 7: digital output
 * 8: virtual input
 */
export async function updateLocksGeneral(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const locks = await tbb.fetchLocksGeneral()
  const locksInput = await tbb.fetchLocksInput()
  if (!locks.length && !locksInput.length)
    return false

  const data = locks.map(d => ({
    MACHINEID: machineId,
    LOCKNO: d.lockNo,
    LOCKNAME: d.lockName,
    LOGICTYPE: d.logicType,
    STOPDYEING: d.stopDyeing,
    JUMPSTEP: d.jumpStep,
    ALARM: d.alarm,
    ONDELAY: d.onDelay,
    STEPDELAY: d.stepDelay,
    GIVEMESSAGE: d.giveMessage,
    MESSAGESTRING: d.messageString,

    AINLOGICTYPE: 0,
    DINLOGICTYPE: 0,
    COMMANDLOGICTYPE: 0,
    LOCKLOGICTYPE: 0,
    DOUTLOGICTYPE: 0,
    VINLOGICTYPE: 0,
  }))

  for (const d of data) {
    const filtered = locksInput.filter(l => l.lockId === d.LOCKNO)

    d.AINLOGICTYPE = filtered.find(l => l.inputType === 0)?.logicType ?? 0
    d.DINLOGICTYPE = filtered.find(l => l.inputType === 1)?.logicType ?? 0
    d.COMMANDLOGICTYPE = filtered.find(l => l.inputType === 4)?.logicType ?? 0
    d.LOCKLOGICTYPE = filtered.find(l => l.inputType === 5)?.logicType ?? 0
    d.DOUTLOGICTYPE = filtered.find(l => l.inputType === 7)?.logicType ?? 0
    d.VINLOGICTYPE = filtered.find(l => l.inputType === 8)?.logicType ?? 0
  }

  return await replaceRecords(trx, 'BFLOCKSGENERAL', data, { MACHINEID: machineId })
}

export async function updateSystemParams(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const system = await tbb.fetchSystemParams()
  if (!system)
    return false

  try {
    await trx('BFMACHINESYSTEMPARAMS')
      .where('MachineId', machineId)
      .del()

    const fromProjectLanguage = system.FROM_PROJECT_LANGUAGE as string | undefined
    if (fromProjectLanguage && fromProjectLanguage !== '-1') {
      await trx('BFMACHINES')
        .where('MACHINEID', machineId)
        .update({
          LANGUAGEID: fromProjectLanguage,
        })
    }

    const systemParams = Object.entries(system).map(([key, value]) => ({
      MachineId: machineId,
      ParamToken: key,
      ParamValue: value,
    }))
    await trx('BFMACHINESYSTEMPARAMS').insert(systemParams)

    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

export async function updateCycleControl(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const control = await tbb.fetchCycleControl()
  if (!control.length)
    return false
  try {
    await trx('BFMACHINES')
      .where('MACHINEID', machineId)
      .update({
        REELCOUNT: control[0].reelCount,
      })
    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

export async function updateBatchParameters(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const params = await tbb.fetchBatchParameters()
  if (!params.length)
    return false
  const data = params.map((d) => {
    return {
      BATCHPARAMETERID: d.batchParameterId,
      MACHINEID: machineId,
      PARAMSTRING: d.paramString,
      PARAMLOWLIMIT: d.min,
      PARAMHIGHLIMIT: d.max,
      DEFAULTVALUE: d.default,
      UNITCODE: d.unitCode,
      FORMAT: d.format,
      UNITTEXT: d.unitText,
      PARAMETERID: d.parameterId,
      SELECTIONLIST: d.selectionList.length ? d.selectionList.join(',') : 'YOK',
      SELECTIONVALUES: d.selectionValues.length ? d.selectionValues.join(',') : 'YOK',
      SELECTIONLISTDEFAULT: d.selectionListDefault,
      BATCHPLANNING: false,
      BATCHSTART: true,
      RECIPE: false,
      PARAMETERTYPE: 1,
      ISDELETED: false,
      TBBCHANGETIME: null,
      CHANGETIME: null,
      PARAMSTRINGEn: d.paramString,
    }
  })

  return await replaceRecords(trx, 'BFMACHBATCHPARAMETERS', data, { MACHINEID: machineId })
}

export async function updateIcons(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const icons = await tbb.fetchIcons()

  if (!icons.length)
    return false

  const data = icons.map((d) => {
    return {
      MACHINEID: machineId,
      ICONTYPE: d.type,
      ICONNAME: d.name,
      ICONDATA: d.data,
    }
  })

  return await replaceRecords(trx, 'BFCUSTOMCOMMANDICONS', data, { MACHINEID: machineId })
}

export async function writeFinishReasons(tbb: TbbFtpClient, trx: Knex) {
  const finishReasons = await trx('BFDYLOTFINISHREASONS').select({
    reasonId: 'REASONID',
    typeId: 'TYPEID',
    text: 'TEXT',
    reportToERP: 'ReportToERP',
  })

  await tbb.uploadFinishReasons(finishReasons)

  return finishReasons
}

export async function writeStopReasons(tbb: TbbFtpClient, trx: Knex) {
  const stopReasons = await trx('BFSTOPREASONS').select({
    stopCode: 'STOPCODE',
    stopName: 'STOPNAME',
    reportToERP: 'ReportToERP',
  })

  await tbb.uploadStopReasons(stopReasons)

  return stopReasons
}

export async function writeMachineParameterValues(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const values = await trx('BFMACHPARAMETERS').where('MACHINEID', machineId).select({
    id: 'MACHINEPARAMETERID',
    currentValue: 'currentValue',
  })

  await tbb.uploadStopReasons(values)

  return values
}

export async function writeUsers(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const users = await trx('BFUSERS').select({
    userId: 'userID',
    userName: 'userName',
    userSurname: 'userSurname',
    userPass: 'userPass',
    userInfo: 'userInfo',
    userActive: 'userActive',
    userType: 'userType',
    userMode: 'userMode',
    userMode2: 'userMode2',
  })

  await tbb.uploadUsers(users)

  return users
}

export async function writeGlobalCommandFormulas(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const formulas = await trx('BFCOMMANDFORMULAS')
    .where('machineId', machineId)
    .select(
      'formula',
      'formulaId',
      'commandNo',
      'commandParameterNo',
      'formulaName',
    )

  await tbb.uploadGlobalCommandFormulas(formulas)

  return formulas
}

// used in upload dye house definitions
export async function writeManualReasonsGeneral(tbb: TbbFtpClient, trx: Knex) {
  const formulas = await trx('BFMANUALREASONSGENERAL')
    .select({
      manualCode: 'manualID',
      manualName: 'manualString',
    })

  await tbb.uploadManualReasons(formulas)

  return formulas
}

export async function updateLocksOutput(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const { analogLocks, digitalLocks } = await tbb.fetchLocksOutput()
  if (!analogLocks.length && !digitalLocks.length)
    return false

  const analogOutputs: LockOutputAnalog[] = []
  const digitalOutputs: LockOutputDigital[] = []

  analogLocks.forEach((lock) => {
    lock.analogOutputs.forEach((output, index) => {
      analogOutputs.push({
        MACHINEID: machineId,
        LOCKNO: lock.lockNo,
        LOCKAOUTINDEX: index,
        ID: output.outputId,
        PERCENTAGE: output.percentage,
      })
    })
  })

  digitalLocks.forEach((lock) => {
    lock.digitalOutputs.forEach((output, index) => {
      digitalOutputs.push({
        MACHINEID: machineId,
        LOCKNO: lock.lockNo,
        LOCKDOUTINDEX: index,
        ID: output.outputId,
        STATE: output.state,
      })
    })
  })

  if (analogOutputs.length > 0) {
    await replaceRecords(trx, 'BFLOCKSOUTPUTAOUT', analogOutputs, { MACHINEID: machineId })
  }

  if (digitalOutputs.length > 0) {
    await replaceRecords(trx, 'BFLOCKSOUTPUTDOUT', digitalOutputs, { MACHINEID: machineId })
  }
  return true
}

export async function writeCommandAlarmReasons(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const reasons: CommandAlarmReason[] = await trx('BFCOMMANDTIMEOUTREASONS')
    .leftJoin('BFCOMMANDTIMEOUTREASONMAP', 'BFCOMMANDTIMEOUTREASONS.ID', 'BFCOMMANDTIMEOUTREASONMAP.REASONID')
    .where('BFCOMMANDTIMEOUTREASONMAP.MACHINEID', machineId)
    .select({
      id: 'ID',
      reasonText: 'REASONTEXT',
      groupId: 'GROUPID',
      machineId: 'MACHINEID',
      commandNo: 'COMMANDNO',
    })

  const mergedReasons: CommandAlarmReason[] = reasons.reduce((acc: CommandAlarmReason[], curr) => {
    const existingReason = acc.find(reason => reason.machineId === curr.machineId && reason.id === curr.id)
    if (existingReason) {
      existingReason.commandNumbers.push(curr.commandNo)
    } else {
      acc.push({ ...curr, commandNumbers: [curr.commandNo] })
    }
    return acc
  }, [])

  await tbb.uploadCommandAlarmReasons(mergedReasons)

  return mergedReasons
}

export async function updateArchives(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  let maxVersion = -1
  const trxTime = trx.fn.now()
  const version = await trx('BAMASTERCOMMANDS').where('MACHINEID', machineId).max('MACHINECOMMANDSETNO as maxVersion')
  maxVersion = version[0].maxVersion || 0

  maxVersion++

  try {
    await trx('BAMASTERCOMMANDS')
      .update({ RELEASEENDDATE: trxTime })
      .where('MACHINEID', machineId)
      .andWhere('MACHINECOMMANDSETNO', maxVersion)

    await trx('BAMASTERCOMMANDS')
      .insert(function (this: Knex) {
        this.select('MACHINEID', trx.raw(maxVersion), trxTime, trx.raw('NULL'), 'COMMANDNO', 'FUNCTIONID', 'TBBFUNTIONNAME', 'BFMASTERCOMMANDS.NAME as NAME', 'ACTIVATED', 'ADVICELIST', 'DONTUSELIST', 'ISRUNMANUAL', 'COMMANDTYPE', 'MOVEPARALLEL', 'TBBCHANGETIME', 'X', 'Y', 'A', 'B', 'MAXA', 'ISTEMPERATURE', 'ISUNLOAD', 'BFMASTERCOMMANDS.ICON', 'BFMASTERCOMMANDS.GROUPID')
          .from('BFMASTERCOMMANDS')
          .where('MACHINEID', '=', machineId)
      })

    await trx('BAMASTERCOMMANDSALARMS')
      .insert(function (this: Knex) {
        this.select(trx.raw(machineId), trx.raw(maxVersion), 'COMMANDNO', 'ALARMINDEX', 'ALARMNO', 'ALARM', 'UNIVERSALALARMNO')
          .from('BFMASTERCOMMANDSALARMS')
          .where('MACHINEID', '=', machineId)
      })

    await trx('BAMASTERCOMMANDRETURNVALUES')
      .insert(function (this: Knex) {
        this.select(trx.raw(machineId), trx.raw(maxVersion), 'COMMANDNO', 'RETURNVALUEINDEX', 'RETURNVALUENAME', 'CANSHOW', 'SPRELATION')
          .from('BFMASTERCOMMANDRETURNVALUES')
          .where('MACHINEID', '=', machineId)
      })

    await trx('BACOMMANDINPUTOUTPUTS')
      .insert(function (this: Knex) {
        this.select(trx.raw(machineId), trx.raw(maxVersion), 'COMMANDNO', 'IOINDEX', 'IOID', 'IOTYPE', 'NAME')
          .from('BFCOMMANDINPUTOUTPUTS')
          .where('MACHINEID', '=', machineId)
      })

    await trx('BACOMMANDSELECTIONLIST')
      .insert(function (this: Knex) {
        this.select(trx.raw(machineId), trx.raw(maxVersion), 'COMMANDNO', 'IOINDEX', 'SELECTINDEX', 'IOTYPE', 'IOID', 'NAME', 'SELECTEDIOID', 'ISDEFAULT')
          .from('BFCOMMANDSELECTIONLIST')
          .where('MACHINEID', '=', machineId)
      })

    await trx('BACOMMANDPARAMETERS')
      .insert(function (this: Knex) {
        this.select(trx.raw(machineId), trx.raw(maxVersion), 'COMMANDNO', 'PARAMETERINDEX', 'PARAMSTRING', 'VALUE', 'PARAMETERTYPE', 'SELECTIONLIST', 'SELECTIONVALUES', 'UNITCODE', 'PARAMLOWLIMIT', 'PARAMHIGHLIMIT', 'CONTAINSVARIABLE', 'TEMPERATURE', 'USEDEFAULT', 'ISCOMMANDVARIABLE', 'TBBFORMUL', 'USEFORMULA')
          .from('BFCOMMANDPARAMETERS')
          .where('MACHINEID', '=', machineId)
      })

    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

export async function updateERPParams(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  try {
    const batchParams = await trx('BFMACHBATCHPARAMETERS')
      .where({ MACHINEID: machineId })
      .orderBy('BATCHPARAMETERID', 'asc')

    const erpParameters = await trx('BFERPPARAMETERDEFINITIONS')
      .where({ MACHINEID: machineId })
      .orderBy('PARAMID', 'asc')

    const erpMap = new Map(
      erpParameters.map(p => [p.PARAMNAME, p.ERPFIELDNAME]),
    )

    const data = batchParams.map(d => ({
      PARAMID: d.BATCHPARAMETERID,
      PARAMNAME: d.PARAMSTRING,
      PARAMTYPE: d.PARAMETERTYPE,
      ERPFIELDNAME: erpMap.get(d.PARAMSTRING) || '',
      BATCHREPORTVISIBLE: 0,
      BATCHREPORTORDER: -1,
      PartyNoParam: 0,
      PARAMNAMEEn: d.PARAMSTRINGEn,
      MACHINEID: machineId,
    }))

    await trx('BFERPPARAMETERDEFINITIONS').where({ MACHINEID: machineId }).del()
    await trx('BFERPPARAMETERDEFINITIONS').insert(data)

    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}

export async function updateMachineTranslations(
  machineId: number,
  tbb: TbbFtpClient,
  trx: Knex,
) {
  try {
    const translations = await tbb.fetchTranslations()

    await trx('BFPROJECTTRANSLATIONS').delete().where('machine_id', machineId)
    await trx('BFPROJECTMESSAGES').delete().where('machine_id', machineId)
    await insertBatch(trx, 'BFPROJECTMESSAGES', translations.map((tr, i) => ({
      machine_id: machineId,
      message_id: i,
      note: tr[0].text,
    })))
    await insertBatch(trx, 'BFPROJECTTRANSLATIONS', translations.flatMap((tr, i) => {
      return tr.map(txt => ({
        machine_id: machineId,
        message_id: i,
        locale_id: txt.locale,
        text: txt.text,
      }))
    }))

    return true
  } catch (err: any) {
    throw new DatabaseQueryError(err.message)
  }
}
