import type { Knex } from 'knex'
import type { CalibrationAnalogInput, LockOutputAnalog, LockOutputDigital, TbbFtpClient } from '@teleskop/tbb-ftp-client'
import { insertBatch } from '@teleskop/utils'
import type { BFCOMMANDINPUTOUTPUTS, BFCOMMANDSELECTIONLIST } from '@teleskop/core'
import { DatabaseQueryError, MSSQL_ERROR_CODE, UnsupportedDatabaseVersionError, inferInvalidColumnError } from '../error'
import { fetchDatabaseVersion } from './version'
import { calcIONumber, getIONames, omitUndefined } from './index'
import type { CommandAlarmReason, FunctionAlarm } from '~/types'

/**
 * Makine sabitlerine bağlı MIN/MAX değerlerinin tutulduğu sütunların eklendiği veri tabanı versiyonu
 */
const machineConstantForMinMaxLimitDbVersion = '3.4.25.0'

async function replaceRecords(trx: Knex.Transaction, tableName: string, data: any[], whereObject?: Record<string, any>): Promise<boolean> {
  const delQuery = trx(tableName).del()
  if (whereObject)
    delQuery.where(whereObject)

  try {
    await delQuery
    await insertBatch(trx, tableName, data)
    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message, { cause: error })
  }
}

async function insertIgnoringDuplicates(trx: Knex.Transaction, tableName: string, data: any[], uniqueColumns: string[]) {
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

export async function updateAnalogInputs(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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
    throw new DatabaseQueryError(error.message, { cause: error })
  }
}

export async function updateAnalogOutputs(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateDigitalInputs(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateDigitalOutputs(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateCounters(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateFinishReasons(tbb: TbbFtpClient, trx: Knex.Transaction) {
  const finishReasons = await tbb.fetchFinishReasons()
  if (!finishReasons.length)
    return false
  return await replaceRecords(trx, 'BFDYLOTFINISHREASONS', finishReasons)
}

// used in project load only
export async function updateManualReasons(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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
export async function updateManualReasonsGeneral(tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateStopReasons(tbb: TbbFtpClient, trx: Knex.Transaction) {
  const stopReasons = await tbb.fetchStopReasons()
  if (!stopReasons.length)
    return false
  return await replaceRecords(trx, 'BFSTOPREASONS', stopReasons)
}

export async function updateMachineController(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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
    throw new DatabaseQueryError(error.message, { cause: error })
  }
}

export async function updateCommandGroups(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateIOChangedEvent(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateUsers(tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateCommandsGeneral(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateCommandGraphic(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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
    throw new DatabaseQueryError(error.message, { cause: error })
  }
}

export async function updateMachineParameters(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateCommandEditing(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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
    throw new DatabaseQueryError(error.message, { cause: error })
  }
}

export async function updateCommandFeedback(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateConsumption(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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
    throw new DatabaseQueryError(error.message, { cause: error })
  }
}

export async function updateGlobalCommandFormulas(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateCommandParameters(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
  const parameters = await tbb.fetchCommandParams()
  if (!parameters.length) {
    return false
  }

  const data = parameters.map((p) => {
    return omitUndefined({
      MACHINEID: machineId,
      COMMANDNO: p.commandNo,
      PARAMSTRING: p.paramName,
      COMMANDDEFINITION: false,
      PROGRAMEDITING: p.binding === 1,
      BATCHPLANNING: false,
      BATCHSTART: p.binding === 2,
      COMMANDRUN: false,
      RECIPE: false,
      VALUE: p.paramFormula ? p.paramFormula : (p.defaultValue).toString(),
      PARAMETERTYPE: (p.selectionList?.length || p.binding === 5) ? 1 : 0,
      SELECTIONLIST: p.selectionList?.length ? p.selectionList.map(d => `"${d.name}"`).join(' ') : '',
      SELECTIONVALUES: p.selectionList?.length ? p.selectionList.map(d => `"${d.value}"`).join(' ') : '',
      UNITCODE: 0,
      PARAMLOWLIMIT: p.minValue,
      PARAMHIGHLIMIT: p.maxValue,
      CONTAINSVARIABLE: !!p.paramFormula,
      TEMPERATURE: p.graphic,
      USEDEFAULT: p.binding === 2 || p.binding === 3,
      ISCOMMANDVARIABLE: false,
      TBBFORMUL: !!p.paramFormula,
      USEFORMULA: p.binding === 5,
      PARAMETERINDEX: p.paramIndex,
      // Yeni eklenen sütunlar (4.23.5 ve sonrası)
      MACHINECONSTANTFORLOWLIMIT: p.machineConstantIdMin,
      MACHINECONSTANTFORHIGHLIMIT: p.machineConstantIdMax,
    })
  })

  try {
    return await replaceRecords(trx, 'BFCOMMANDPARAMETERS', data, { MACHINEID: machineId })
  } catch (error: unknown) {
    if (error instanceof DatabaseQueryError) {
      const invalidColumnErrors = error.getMssqlErrors()
        .filter(e => e.number === MSSQL_ERROR_CODE.SQ_BADCOL)
      const invalidColumns = invalidColumnErrors
        .map(e => inferInvalidColumnError(e.message))

      const newColumns = ['MACHINECONSTANTFORLOWLIMIT', 'MACHINECONSTANTFORHIGHLIMIT']
      if (invalidColumns.some(col => col && newColumns.includes(col))) {
        const version = await fetchDatabaseVersion(trx)
        throw new UnsupportedDatabaseVersionError(machineConstantForMinMaxLimitDbVersion, version)
      }
    }
  }
}

export async function updateCommandAlarmReasons(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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
    throw new DatabaseQueryError(error.message, { cause: error })
  }
}

export async function updateCommandAlarms(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateCommandIO(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
  const ioList = await tbb.fetchCommandIoList()
  if (!ioList.length)
    return false

  const inputsOutputs = [] as BFCOMMANDINPUTOUTPUTS[]
  const selectionList = [] as BFCOMMANDSELECTIONLIST[]

  const ioNames = await getIONames(machineId, trx)

  for (const io of ioList) {
    if (io.isSelectableIO) {
      inputsOutputs.push({
        IOINDEX: io.ioIndex,
        MACHINEID: machineId,
        COMMANDNO: io.commandNo,
        IOID: io.selectionList[0].ioId,
        NAME: io.ioName,
        IOTYPE: 5,
        PROGRAMEDITING: false,
        COMMANDRUN: false,
      })
      selectionList.push(...io.selectionList.map((c) => {
        const ioName = ioNames[c.ioType - 1]?.find(d => d.id === c.ioId)?.name || ''
        return {
          IOINDEX: io.ioIndex,
          MACHINEID: machineId,
          COMMANDNO: io.commandNo,
          IOID: c.ioId,
          SELECTINDEX: c.selectIndex,
          IOTYPE: c.ioType - 1,
          NAME: ioName,
          SELECTEDIOID: c.ioId,
          ISDEFAULT: c.isDefault,
          MODEL: 'MODEL',
          EXTENTION: 'EXTENSION',
        }
      }))
    } else {
      inputsOutputs.push({
        IOINDEX: io.ioIndex,
        MACHINEID: machineId,
        COMMANDNO: io.commandNo,
        IOID: io.ioId,
        NAME: io.ioName,
        IOTYPE: io.ioType - 1,
        PROGRAMEDITING: false,
        COMMANDRUN: false,
      })
    }
  }
  try {
    await replaceRecords(trx, 'BFCOMMANDINPUTOUTPUTS', inputsOutputs, { MACHINEID: machineId })
    await replaceRecords(trx, 'BFCOMMANDSELECTIONLIST', selectionList, { MACHINEID: machineId })

    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message, { cause: error })
  }
}

export async function updateLocksInput(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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
    throw new DatabaseQueryError(error.message, { cause: error })
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
export async function updateLocksGeneral(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateSystemParams(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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
    throw new DatabaseQueryError(error.message, { cause: error })
  }
}

export async function updateCycleControl(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
  const control = await tbb.fetchCycleControl()
  try {
    await trx('BFMACHINES')
      .where('MACHINEID', machineId)
      .update({
        REELCOUNT: control.reelCount,
      })
    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message, { cause: error })
  }
}

export async function updateBatchParameters(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
  const params = await tbb.fetchBatchParameters()
  if (!params.length)
    return false
  const data = params.map((d) => {
    return omitUndefined({
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
      // Yeni eklenen sütunlar (4.23.5 ve sonrası)
      VISIBILITY: d.visibility,
      MACHINECONSTANTFORLOWLIMIT: d.machineConstantIdMin,
      MACHINECONSTANTFORHIGHLIMIT: d.machineConstantIdMax,
    })
  })

  try {
    return await replaceRecords(trx, 'BFMACHBATCHPARAMETERS', data, { MACHINEID: machineId })
  } catch (error: unknown) {
    if (error instanceof DatabaseQueryError) {
      const invalidColumnErrors = error.getMssqlErrors()
        .filter(e => e.number === MSSQL_ERROR_CODE.SQ_BADCOL)
      const invalidColumns = invalidColumnErrors
        .map(e => inferInvalidColumnError(e.message))

      const newColumns = ['VISIBILITY', 'MACHINECONSTANTFORLOWLIMIT', 'MACHINECONSTANTFORHIGHLIMIT']
      if (invalidColumns.some(col => col && newColumns.includes(col))) {
        const version = await fetchDatabaseVersion(trx)
        throw new UnsupportedDatabaseVersionError(machineConstantForMinMaxLimitDbVersion, version)
      }
    }
    throw error
  }
}

export async function updateIcons(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function writeFinishReasons(tbb: TbbFtpClient, trx: Knex.Transaction) {
  const finishReasons = await trx('BFDYLOTFINISHREASONS').select({
    reasonId: 'REASONID',
    typeId: 'TYPEID',
    text: 'TEXT',
    reportToERP: 'ReportToERP',
  })

  await tbb.uploadFinishReasons(finishReasons)

  return finishReasons
}

export async function writeStopReasons(tbb: TbbFtpClient, trx: Knex.Transaction) {
  const stopReasons = await trx('BFSTOPREASONS').select({
    stopCode: 'STOPCODE',
    stopName: 'STOPNAME',
    reportToERP: 'ReportToERP',
  })

  await tbb.uploadStopReasons(stopReasons)

  return stopReasons
}

export async function writeMachineParameterValues(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
  const values = await trx('BFMACHPARAMETERS').where('MACHINEID', machineId).select({
    id: 'MACHINEPARAMETERID',
    currentValue: 'currentValue',
  })

  await tbb.uploadStopReasons(values)

  return values
}

export async function writeUsers(tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function writeGlobalCommandFormulas(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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
export async function writeManualReasonsGeneral(tbb: TbbFtpClient, trx: Knex.Transaction) {
  const formulas = await trx('BFMANUALREASONSGENERAL')
    .select({
      manualCode: 'manualID',
      manualName: 'manualString',
    })

  await tbb.uploadManualReasons(formulas)

  return formulas
}

export async function updateLocksOutput(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function writeCommandAlarmReasons(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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

export async function updateArchives(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
  // Determine new version number
  const trxTime = trx.fn.now()
  const versionRow = await trx('BAMASTERCOMMANDS')
    .where('MACHINEID', machineId)
    .max('MACHINECOMMANDSETNO as maxVersion')

  const previousVersion: number | null = versionRow[0].maxVersion ?? null
  const newVersion = (previousVersion ?? 0) + 1

  try {
    // Close previous version if exists
    if (previousVersion !== null) {
      await trx('BAMASTERCOMMANDS')
        .update({ RELEASEENDDATE: trxTime })
        .where('MACHINEID', machineId)
        .andWhere('MACHINECOMMANDSETNO', previousVersion)
    }

    // Fetch current master data to snapshot

    const commands = await trx('BFMASTERCOMMANDS')
      .where('MACHINEID', machineId)
      .select(
        'COMMANDNO',
        'FUNCTIONID',
        'TBBFUNTIONNAME',
        'NAME',
        'ACTIVATED',
        'ADVICELIST',
        'DONTUSELIST',
        'ISRUNMANUAL',
        'COMMANDTYPE',
        'MOVEPARALLEL',
        'TBBCHANGETIME',
        'X',
        'Y',
        'A',
        'B',
        'MAXA',
        'ISTEMPERATURE',
        'ISUNLOAD',
        'ICON',
        'GROUPID',
      )

    const cmdAlarms = await trx('BFMASTERCOMMANDSALARMS')
      .where('MACHINEID', machineId)
      .select('COMMANDNO', 'ALARMINDEX', 'ALARMNO', 'ALARM', 'UNIVERSALALARMNO')

    const cmdReturnValues = await trx('BFMASTERCOMMANDRETURNVALUES')
      .where('MACHINEID', machineId)
      .select('COMMANDNO', 'RETURNVALUEINDEX', 'RETURNVALUENAME', 'CANSHOW', 'SPRELATION')

    const cmdInputOutputs = await trx('BFCOMMANDINPUTOUTPUTS')
      .where('MACHINEID', machineId)
      .select('COMMANDNO', 'IOINDEX', 'IOID', 'IOTYPE', 'NAME')

    const cmdSelectionList = await trx('BFCOMMANDSELECTIONLIST')
      .where('MACHINEID', machineId)
      .select('COMMANDNO', 'IOINDEX', 'SELECTINDEX', 'IOTYPE', 'IOID', 'NAME', 'SELECTEDIOID', 'ISDEFAULT')

    const cmdParameters = await trx('BFCOMMANDPARAMETERS')
      .where('MACHINEID', machineId)
      .select(
        'COMMANDNO',
        'PARAMETERINDEX',
        'PARAMSTRING',
        'VALUE',
        'PARAMETERTYPE',
        'SELECTIONLIST',
        'SELECTIONVALUES',
        'UNITCODE',
        'PARAMLOWLIMIT',
        'PARAMHIGHLIMIT',
        'CONTAINSVARIABLE',
        'TEMPERATURE',
        'USEDEFAULT',
        'ISCOMMANDVARIABLE',
        'TBBFORMUL',
        'USEFORMULA',
      )

    const machineParameters = await trx('BFMACHPARAMETERS')
      .where('MACHINEID', machineId)
      .select(
        'MACHINEPARAMETERID',
        'PARAMSTRING',
        'PARAMLOWLIMIT',
        'PARAMHIGHLIMIT',
        'PARAMETERTYPE',
        'SELECTIONLIST',
        'UNITCODE',
        'SELECTIONVALUES',
        'ISDELETED',
        'TBBCHANGETIME',
        'CHANGETIME',
        'DEFAULTVALUE',
        'dmArea',
        'consScreen',
        'consFormat',
        'consUnit',
        'currentValue',
      )

    const machineBatchParameters = await trx('BFMACHBATCHPARAMETERS')
      .where('MACHINEID', machineId)
      .select(
        'BATCHPARAMETERID',
        'PARAMSTRING',
        'PARAMLOWLIMIT',
        'PARAMHIGHLIMIT',
        'BATCHPLANNING',
        'BATCHSTART',
        'RECIPE',
        'DEFAULTVALUE',
        'PARAMETERTYPE',
        'SELECTIONLIST',
        'UNITCODE',
        'SELECTIONVALUES',
        'ISDELETED',
        'TBBCHANGETIME',
        'CHANGETIME',
        'FORMAT',
        'PARAMETERID',
        'UNITTEXT',
        'PARAMSTRINGEn',
        'SELECTIONLISTDEFAULT',
      )

    const cmdFormulas = await trx('BFCOMMANDFORMULAS')
      .where('machineId', machineId)
      .select(
        'formulaId',
        'formula',
        'commandNo',
        'commandParameterNo',
        'formulaName',
      )

    const machineAnalogInputs = await trx('BFMACHAIN')
      .where('MACHINEID', machineId)
      .select(
        'ID',
        'CARD',
        'CANAL',
        'NAME',
        'ENABLED',
        'ISDELETED',
        'TBBCHANGETIME',
        'CHANGETIME',
        'MIMICID',
        'CALIBTYPE',
        'CALIBMAXVALUE',
        'CALIBUNIT',
        'CALIBLOWERLIMIT',
        'CALIBUPPERLIMIT',
      )

    const machineAnalogOutputs = await trx('BFMACHAOUT')
      .where('MACHINEID', machineId)
      .select(
        'ID',
        'CARD',
        'CANAL',
        'NAME',
        'DEFAULTVALUE',
        'ENABLED',
        'ISDELETED',
        'TBBCHANGETIME',
        'CHANGETIME',
        'MIMICID',
      )

    const machineDigitalInputs = await trx('BFMACHDIN')
      .where('MACHINEID', machineId)
      .select(
        'ID',
        'CARD',
        'CANAL',
        'NAME',
        'ENABLED',
        'ISDELETED',
        'TBBCHANGETIME',
        'CHANGETIME',
      )

    const machineDigitalOutputs = await trx('BFMACHDOUT')
      .where('MACHINEID', machineId)
      .select(
        'ID',
        'CARD',
        'CANAL',
        'NAME',
        'DEFAULTVALUE',
        'ENABLED',
        'ISDELETED',
        'TBBCHANGETIME',
        'CHANGETIME',
      )

    const machineCounters = await trx('BFMACHCOUNTER')
      .where('MACHINEID', machineId)
      .select(
        'ID',
        'CARD',
        'CANAL',
        'NAME',
        'ENABLED',
        'ISDELETED',
        'TBBCHANGETIME',
        'CHANGETIME',
        'CALIBUNIT',
      )

    const machineVirtualInputs = await trx('BFMACHVIN')
      .where('MACHINEID', machineId)
      .select(
        'ID',
        'BUTTONTYPE',
        'NAME',
        'ENABLED',
        'ISDELETED',
      )

    // Prepare batch insert payloads
    const commandInserts = commands.map(mc => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      RELEASEDATE: trxTime,
      RELEASEENDDATE: null,
      COMMANDNO: mc.COMMANDNO,
      FUNCTIONID: mc.FUNCTIONID,
      TBBFUNTIONNAME: mc.TBBFUNTIONNAME,
      NAME: mc.NAME,
      ACTIVATED: mc.ACTIVATED,
      ADVICELIST: mc.ADVICELIST,
      DONTUSELIST: mc.DONTUSELIST,
      ISRUNMANUAL: mc.ISRUNMANUAL,
      COMMANDTYPE: mc.COMMANDTYPE,
      MOVEPARALLEL: mc.MOVEPARALLEL,
      TBBCHANGETIME: mc.TBBCHANGETIME,
      X: mc.X,
      Y: mc.Y,
      A: mc.A,
      B: mc.B,
      MAXA: mc.MAXA,
      ISTEMPERATURE: mc.ISTEMPERATURE,
      ISUNLOAD: mc.ISUNLOAD,
      ICON: mc.ICON,
      GROUPID: mc.GROUPID,
    }))

    const cmdAlarmInserts = cmdAlarms.map(a => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      COMMANDNO: a.COMMANDNO,
      ALARMINDEX: a.ALARMINDEX,
      ALARMNO: a.ALARMNO,
      ALARM: a.ALARM,
      UNIVERSALALARMNO: a.UNIVERSALALARMNO,
    }))

    const cmdReturnValueInserts = cmdReturnValues.map(r => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      COMMANDNO: r.COMMANDNO,
      RETURNVALUEINDEX: r.RETURNVALUEINDEX,
      RETURNVALUENAME: r.RETURNVALUENAME,
      CANSHOW: r.CANSHOW,
      SPRELATION: r.SPRELATION,
    }))

    const cmdInputOutputInserts = cmdInputOutputs.map(io => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      COMMANDNO: io.COMMANDNO,
      IOINDEX: io.IOINDEX,
      IOID: io.IOID,
      IOTYPE: io.IOTYPE,
      NAME: io.NAME,
    }))

    const cmdSelectionListInserts = cmdSelectionList.map(sl => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      COMMANDNO: sl.COMMANDNO,
      IOINDEX: sl.IOINDEX,
      SELECTINDEX: sl.SELECTINDEX,
      IOTYPE: sl.IOTYPE,
      IOID: sl.IOID,
      NAME: sl.NAME,
      SELECTEDIOID: sl.SELECTEDIOID,
      ISDEFAULT: sl.ISDEFAULT,
    }))

    const cmdParameterInserts = cmdParameters.map(p => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      COMMANDNO: p.COMMANDNO,
      PARAMETERINDEX: p.PARAMETERINDEX,
      PARAMSTRING: p.PARAMSTRING,
      VALUE: p.VALUE,
      PARAMETERTYPE: p.PARAMETERTYPE,
      SELECTIONLIST: p.SELECTIONLIST,
      SELECTIONVALUES: p.SELECTIONVALUES,
      UNITCODE: p.UNITCODE,
      PARAMLOWLIMIT: p.PARAMLOWLIMIT,
      PARAMHIGHLIMIT: p.PARAMHIGHLIMIT,
      CONTAINSVARIABLE: p.CONTAINSVARIABLE,
      TEMPERATURE: p.TEMPERATURE,
      USEDEFAULT: p.USEDEFAULT,
      ISCOMMANDVARIABLE: p.ISCOMMANDVARIABLE,
      TBBFORMUL: p.TBBFORMUL,
      USEFORMULA: p.USEFORMULA,
    }))

    const machineParameterInserts = machineParameters.map(mp => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      MACHINEPARAMETERID: mp.MACHINEPARAMETERID,
      PARAMSTRING: mp.PARAMSTRING,
      PARAMLOWLIMIT: mp.PARAMLOWLIMIT,
      PARAMHIGHLIMIT: mp.PARAMHIGHLIMIT,
      PARAMETERTYPE: mp.PARAMETERTYPE,
      SELECTIONLIST: mp.SELECTIONLIST,
      UNITCODE: mp.UNITCODE,
      SELECTIONVALUES: mp.SELECTIONVALUES,
      ISDELETED: mp.ISDELETED,
      TBBCHANGETIME: mp.TBBCHANGETIME,
      CHANGETIME: mp.CHANGETIME,
      DEFAULTVALUE: mp.DEFAULTVALUE,
      dmArea: mp.dmArea,
      consScreen: mp.consScreen,
      consFormat: mp.consFormat,
      consUnit: mp.consUnit,
      currentValue: mp.currentValue,
    }))

    const machineBatchParameterInserts = machineBatchParameters.map(mbp => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      BATCHPARAMETERID: mbp.BATCHPARAMETERID,
      PARAMSTRING: mbp.PARAMSTRING,
      PARAMLOWLIMIT: mbp.PARAMLOWLIMIT,
      PARAMHIGHLIMIT: mbp.PARAMHIGHLIMIT,
      BATCHPLANNING: mbp.BATCHPLANNING,
      BATCHSTART: mbp.BATCHSTART,
      RECIPE: mbp.RECIPE,
      DEFAULTVALUE: mbp.DEFAULTVALUE,
      PARAMETERTYPE: mbp.PARAMETERTYPE,
      SELECTIONLIST: mbp.SELECTIONLIST,
      UNITCODE: mbp.UNITCODE,
      SELECTIONVALUES: mbp.SELECTIONVALUES,
      ISDELETED: mbp.ISDELETED,
      TBBCHANGETIME: mbp.TBBCHANGETIME,
      CHANGETIME: mbp.CHANGETIME,
      FORMAT: mbp.FORMAT,
      PARAMETERID: mbp.PARAMETERID,
      UNITTEXT: mbp.UNITTEXT,
      PARAMSTRINGEn: mbp.PARAMSTRINGEn,
      SELECTIONLISTDEFAULT: mbp.SELECTIONLISTDEFAULT,
    }))

    const cmdFormulaInserts = cmdFormulas.map(cf => ({
      machineId,
      machineCommandSetNo: newVersion,
      formulaId: cf.formulaId,
      formula: cf.formula,
      commandNo: cf.commandNo,
      commandParameterNo: cf.commandParameterNo,
      formulaName: cf.formulaName,
    }))

    const machineAnalogInputInserts = machineAnalogInputs.map(ai => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      ID: ai.ID,
      CARD: ai.CARD,
      CANAL: ai.CANAL,
      NAME: ai.NAME,
      ENABLED: ai.ENABLED,
      ISDELETED: ai.ISDELETED,
      TBBCHANGETIME: ai.TBBCHANGETIME,
      CHANGETIME: ai.CHANGETIME,
      MIMICID: ai.MIMICID,
      CALIBTYPE: ai.CALIBTYPE,
      CALIBMAXVALUE: ai.CALIBMAXVALUE,
      CALIBUNIT: ai.CALIBUNIT,
      CALIBLOWERLIMIT: ai.CALIBLOWERLIMIT,
      CALIBUPPERLIMIT: ai.CALIBUPPERLIMIT,
    }))

    const machineAnalogOutputInserts = machineAnalogOutputs.map(ao => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      ID: ao.ID,
      CARD: ao.CARD,
      CANAL: ao.CANAL,
      NAME: ao.NAME,
      DEFAULTVALUE: ao.DEFAULTVALUE,
      ENABLED: ao.ENABLED,
      ISDELETED: ao.ISDELETED,
      TBBCHANGETIME: ao.TBBCHANGETIME,
      CHANGETIME: ao.CHANGETIME,
      MIMICID: ao.MIMICID,
    }))

    const machineDigitalInputInserts = machineDigitalInputs.map(di => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      ID: di.ID,
      CARD: di.CARD,
      CANAL: di.CANAL,
      NAME: di.NAME,
      ENABLED: di.ENABLED,
      ISDELETED: di.ISDELETED,
      TBBCHANGETIME: di.TBBCHANGETIME,
      CHANGETIME: di.CHANGETIME,
    }))

    const machineDigitalOutputInserts = machineDigitalOutputs.map(dout => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      ID: dout.ID,
      CARD: dout.CARD,
      CANAL: dout.CANAL,
      NAME: dout.NAME,
      DEFAULTVALUE: dout.DEFAULTVALUE,
      ENABLED: dout.ENABLED,
      ISDELETED: dout.ISDELETED,
      TBBCHANGETIME: dout.TBBCHANGETIME,
      CHANGETIME: dout.CHANGETIME,
    }))

    const machineCounterInserts = machineCounters.map(c => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      ID: c.ID,
      CARD: c.CARD,
      CANAL: c.CANAL,
      NAME: c.NAME,
      ENABLED: c.ENABLED,
      ISDELETED: c.ISDELETED,
      TBBCHANGETIME: c.TBBCHANGETIME,
      CHANGETIME: c.CHANGETIME,
      CALIBUNIT: c.CALIBUNIT,
    }))

    const machineVirtualInputInserts = machineVirtualInputs.map(vi => ({
      MACHINEID: machineId,
      MACHINECOMMANDSETNO: newVersion,
      ID: vi.ID,
      BUTTONTYPE: vi.BUTTONTYPE,
      NAME: vi.NAME,
      ENABLED: vi.ENABLED,
      ISDELETED: vi.ISDELETED,
    }))

    // Perform batched inserts
    if (commandInserts.length)
      await insertBatch(trx, 'BAMASTERCOMMANDS', commandInserts)
    if (cmdAlarmInserts.length)
      await insertBatch(trx, 'BAMASTERCOMMANDSALARMS', cmdAlarmInserts)
    if (cmdReturnValueInserts.length)
      await insertBatch(trx, 'BAMASTERCOMMANDRETURNVALUES', cmdReturnValueInserts)
    if (cmdInputOutputInserts.length)
      await insertBatch(trx, 'BACOMMANDINPUTOUTPUTS', cmdInputOutputInserts)
    if (cmdSelectionListInserts.length)
      await insertBatch(trx, 'BACOMMANDSELECTIONLIST', cmdSelectionListInserts)
    if (cmdParameterInserts.length)
      await insertBatch(trx, 'BACOMMANDPARAMETERS', cmdParameterInserts)
    if (machineParameterInserts.length)
      await insertBatch(trx, 'BAMACHPARAMETERS', machineParameterInserts)
    if (machineBatchParameterInserts.length)
      await insertBatch(trx, 'BAMACHBATCHPARAMETERS', machineBatchParameterInserts)
    if (cmdFormulaInserts.length)
      await insertBatch(trx, 'BACOMMANDFORMULAS', cmdFormulaInserts)
    if (machineAnalogInputInserts.length)
      await insertBatch(trx, 'BAMACHAIN', machineAnalogInputInserts)
    if (machineAnalogOutputInserts.length)
      await insertBatch(trx, 'BAMACHAOUT', machineAnalogOutputInserts)
    if (machineDigitalInputInserts.length)
      await insertBatch(trx, 'BAMACHDIN', machineDigitalInputInserts)
    if (machineDigitalOutputInserts.length)
      await insertBatch(trx, 'BAMACHDOUT', machineDigitalOutputInserts)
    if (machineCounterInserts.length)
      await insertBatch(trx, 'BAMACHCOUNTER', machineCounterInserts)
    if (machineVirtualInputInserts.length)
      await insertBatch(trx, 'BAMACHVIN', machineVirtualInputInserts)

    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message, { cause: error })
  }
}

export async function updateERPParams(machineId: number, tbb: TbbFtpClient, trx: Knex.Transaction) {
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
    throw new DatabaseQueryError(error.message, { cause: error })
  }
}

export async function updateProjectTranslations(
  machineId: number,
  tbb: TbbFtpClient,
  trx: Knex,
) {
  try {
    let translations = await tbb.fetchTranslations()

    // Filter out entries that have only one translation or all of their translations are identical
    translations = translations.filter((tr) => {
      return tr.length > 1 && tr.slice(1).some(txt => txt.text !== tr[0].text)
    })

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
    throw new DatabaseQueryError(err.message, { cause: err })
  }
}
