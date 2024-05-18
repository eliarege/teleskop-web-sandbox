import type { Knex } from 'knex'
import type { TbbFtpClient } from 'tbb-ftp-client'
import { chunk } from 'lodash-es'
import { DatabaseQueryError } from '../error'
import { calcIONumber } from '.'
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
  } catch (error) {
    throw new DatabaseQueryError(error.message)
  }
}

async function insertIgnoringDuplicates(trx, tableName, data, uniqueColumns) {
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
  const inputs = await tbb.fetchAnalogInputs()
  if (!inputs.length)
    return false
  const controllerModel = await tbb.fetchControllerModel()

  const analogInputs = inputs?.map(d => ({
    MACHINEID: machineId,
    ID: calcIONumber(d, controllerModel),
    CARD: d.card,
    CANAL: d.channel,
    NAME: d.name,
    ENABLED: d.enabled,
    ISDELETED: false,
  }))

  return await replaceRecords(trx, 'BFMACHAIN', analogInputs, { MACHINEID: machineId })
}

export async function updateAnalogOutputs(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const outputs = await tbb.fetchAnalogOutputs()
  if (!outputs.length)
    return false
  const controllerModel = await tbb.fetchControllerModel()
  const analogOutputs = outputs?.map(d => ({
    MACHINEID: machineId,
    ID: calcIONumber(d, controllerModel),
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
    ID: calcIONumber(d, controllerModel),
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
    ID: calcIONumber(d, controllerModel),
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
  const data = counters?.map(d => ({
    MACHINEID: machineId,
    ID: calcIONumber(d, controllerModel),
    CARD: d.card,
    CANAL: d.channel,
    NAME: d.name,
    ENABLED: d.enabled,
    ISDELETED: false,
  }))

  return await replaceRecords(trx, 'BFMACHCOUNTER', data, { MACHINEID: machineId })
}

export async function updateFinishReasons(tbb: TbbFtpClient, trx: Knex) {
  const finishReasons = await tbb.fetchFinishReasons()
  if (!finishReasons.length)
    return false
  return await replaceRecords(trx, 'BFDYLOTFINISHREASONS', finishReasons, undefined)
}

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

export async function updateStopReasons(tbb: TbbFtpClient, trx: Knex) {
  const stopReasons = await tbb.fetchStopReasons()
  if (!stopReasons.length)
    return false
  return await replaceRecords(trx, 'BFSTOPREASONS', stopReasons, undefined)
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
  return await replaceRecords(trx, 'BFUSERS', data, undefined)
}

export async function updateCommandsGeneral(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandsGeneral()
  if (!commands.length)
    return false
  const data = commands.map(d => ({
    COMMANDNO: d.commandNo,
    NAME: d.name,
    TBBFUNTIONNAME: d.tbbFunctionName,
    ICON: d.icon,
    COMMANDTYPE: d.commandType,
    ISRUNMANUAL: d.isRunManual,
    MOVEPARALLEL: d.moveParallel,
    GROUPID: d.groupId,
    MACHINEID: machineId,
    ACTIVATED: (d.activated === '1' && d.machineConstantId && d.machineConstantId !== -1) ? 1 : 0,
    ISDELETED: 0,
    ISCHANGED: 1,
    FUNCTIONID: 0,
  }))

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
  const machineParameters = parameters?.map(d => ({
    MACHINEID: machineId,
    MACHINEPARAMETERID: d.machineParameterId,
    PARAMSTRING: d.paramString,
    DEFAULTVALUE: d.defaultValue,
    dmArea: 9100,
    consScreen: 1,
    PARAMLOWLIMIT: d.paramLowLimit,
    PARAMHIGHLIMIT: d.paramHighLimit,
    consFormat: 0,
    consUnit: 0,
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
        ADVICELIST: (command.adviceList && command.adviceList.length) ? command.adviceList : -1,
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
    SPRELATION: c.SPRelation,
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

  const promises = commands.map(async (c) => {
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
      PARAMETERTYPE: ((c.selectionList && c.selectionList.length) || globalCommandFormula) ? 1 : 0,
      SELECTIONLIST: (c.selectionList && c.selectionList.length) ? c.selectionList.map(d => d.name).join(' ') : '',
      SELECTIONVALUES: (c.selectionList && c.selectionList.length) ? c.selectionList.map(d => d.value).join(' ') : '',
      UNITCODE: 0,
      PARAMLOWLIMIT: c.minValue,
      PARAMHIGHLIMIT: c.maxValue,
      CONTAINSVARIABLE: !!c.paramFormula,
      TEMPERATURE: c.graphic,
      USEDEFAULT: c.binding === 2 || c.binding === 3,
      ISCOMMANDVARIABLE: false,
      TBBFORMUL: !!c.paramFormula,
      USEFORMULA: c.binding === 5,
      PARAMETERINDEX: Number.parseInt(c.name.split(' ')[1]),
    }
  })

  const data = await Promise.all(promises)

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

    if (alarmObj) {
      const alarmTypeIndex = Object.keys(alarmObj)
        .findIndex(key => alarmObj[key as keyof FunctionAlarm]?.includes(c.alarmNo)) + 1

      commandsAlarmsInserts.push({
        MACHINEID: machineId,
        ALARMINDEX: c.alarmNo,
        COMMANDNO: c.commandNo,
        ALARMNO: c.alarmNo,
        UNIVERSALALARMNO: c.alarmNo,
        ALARM: c.alarm,
        ALARMTYPE: alarmTypeIndex || null,
      })
    }
  }

  return await replaceRecords(trx, 'BFMASTERCOMMANDSALARMS', commandsAlarmsInserts, { MACHINEID: machineId })
}

export async function updateCommandIO(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandIO()
  if (!commands.length)
    return false
  const inputsOutputs = []
  const selectionList = []

  for (const [index, command] of commands.entries()) {
    for (const [i, c] of command.chooseList.entries()) {
      const commonData = {
        IOINDEX: c.ioIndex,
        MACHINEID: Number.parseInt(machineId),
        COMMANDNO: command.commandNo,
        IOID: Number.parseInt(c.ioId),
      }
      if (c.selectIndex === 0) {
        inputsOutputs.push({
          ...commonData,
          NAME: c.name.length ? c.name : c.ioType !== 5 ? await getIOName(machineId, c.ioType - 1, c.ioId, trx) : '',
          IOTYPE: c.isChoosableIO ? 5 : c.ioType - 1,
          PROGRAMEDITING: false,
          COMMANDRUN: false,
        })
      }

      selectionList.push({
        ...commonData,
        SELECTINDEX: c.selectIndex,
        IOTYPE: c.ioType - 1,
        NAME: c.ioType !== 5 ? await getIOName(machineId, c.ioType - 1, c.ioId, trx) : '',
        SELECTEDIOID: c.ioId,
        ISDEFAULT: c.isDefault,
        MODEL: 'MODEL',
        EXTENTION: 'EXTENTION',
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
      LOCKNO: d.lockId + 1,
      LOCKAININDEX: index,
      ID: input.id + 1,
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
      LOCKNO: d.lockId + 1,
      LOCKDININDEX: index,
      ID: input.id + 1,
      STATE: input.state,
    })),
  )

  const digitalOutputs = locks.filter(d => d.inputType === 7)
  const digitalOutputsDB = digitalOutputs.flatMap(d =>
    d.inputs.map((input, index) => ({
      MACHINEID: machineId,
      LOCKNO: d.lockId + 1,
      LOCKDOUTINDEX: index,
      ID: input.id + 1,
      STATE: input.state,
    })),
  )

  const commands = locks.filter(d => d.inputType === 4)
  const commandsDB = commands.flatMap(d =>
    d.inputs.map((input, index) => ({
      MACHINEID: machineId,
      LOCKNO: d.lockId + 1,
      COMMANDINDEX: index,
      COMMANDNO: input.id + 1,
      STATE: input.state,
    })),
  )

  const locksInput = locks.filter(d => d.inputType === 5)
  const locksInputDB = locksInput.flatMap(d =>
    d.inputs.map((input, index) => ({
      MACHINEID: machineId,
      LOCKNO: d.lockId + 1,
      LOCKLOCKINDEX: index,
      OTHERLOCKNO: input.id + 1,
      STATE: input.state,
    })),
  )

  const virtualInputs = locks.filter(d => d.inputType === 8)
  const virtualInputsDB = virtualInputs.flatMap(d =>
    d.inputs.map((input, index) => ({
      MACHINEID: machineId,
      LOCKNO: d.lockId + 1,
      LOCKDININDEX: index,
      ID: input.id + 1,
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
    LOCKNO: d.lockNo + 1,
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
    d.AINLOGICTYPE = filtered.find(l => l.logicType === 0)?.logicType ?? 0
    d.DINLOGICTYPE = filtered.find(l => l.logicType === 1)?.logicType ?? 0
    d.COMMANDLOGICTYPE = filtered.find(l => l.logicType === 4)?.logicType ?? 0
    d.LOCKLOGICTYPE = filtered.find(l => l.logicType === 5)?.logicType ?? 0
    d.DOUTLOGICTYPE = filtered.find(l => l.logicType === 7)?.logicType ?? 0
    d.VINLOGICTYPE = filtered.find(l => l.logicType === 8)?.logicType ?? 0
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

    for (const key in system) {
      if (Object.prototype.hasOwnProperty.call(system, key)) {
        const value = system[key as keyof typeof system]
        await trx('BFMACHINESYSTEMPARAMS')
          .insert({
            MachineId: machineId,
            ParamToken: key,
            ParamValue: value,
          })
      }
    }

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
      SELECTIONLIST: JSON.stringify(d.selectionList),
      SELECTIONVALUES: JSON.stringify(d.selectionValues),
      SELECTIONLISTDEFAULT: JSON.stringify(d.selectionListDefault),
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

export async function writeManualReasons(tbb: TbbFtpClient, trx: Knex) {
  const formulas = await trx('BFMANUALREASONSGENERAL')
    .select({
      manualId: 'manualID',
      manualReason: 'manualString',
      reportToERP: 'ReportToERP',
    })

  await tbb.uploadManualReasons(formulas)

  return formulas
}

export async function updateLocksOutput(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const { analogLocks, digitalLocks } = await tbb.fetchLocksOutput()
  if (!analogLocks.length && !digitalLocks.length)
    return false

  const analogOutputs = []
  const digitalOutputs = []

  analogLocks.forEach((lock) => {
    lock.analogOutputs.forEach((output, index) => {
      analogOutputs.push({
        MACHINEID: machineId,
        LOCKNO: lock.lockNo + 1,
        LOCKAOUTINDEX: index,
        ID: output.outputId + 1,
        PERCENTAGE: output.percentage,
      })
    })
  })

  digitalLocks.forEach((lock) => {
    lock.digitalOutputs.forEach((output, index) => {
      digitalOutputs.push({
        MACHINEID: machineId,
        LOCKNO: lock.lockNo + 1,
        LOCKDOUTINDEX: index,
        ID: output.outputId + 1,
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

  const mergedReasons: CommandAlarmReason[] = reasons.reduce((acc, curr) => {
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
      .insert(function () {
        this.select(machineId, maxVersion, trxTime, trx.raw('NULL'), 'COMMANDNO', 'FUNCTIONID', 'TBBFUNTIONNAME', 'BFMASTERCOMMANDS.NAME as NAME', 'ACTIVATED', 'ADVICELIST', 'DONTUSELIST', 'ISRUNMANUAL', 'COMMANDTYPE', 'MOVEPARALLEL', 'TBBCHANGETIME', 'X', 'Y', 'A', 'B', 'MAXA', 'ISTEMPERATURE', 'ISUNLOAD', 'BFMASTERCOMMANDS.ICON', 'BFMASTERCOMMANDS.GROUPID')
          .from('BFMASTERCOMMANDS')
          .where('MACHINEID', '=', machineId)
      })

    await trx('BAMASTERCOMMANDSALARMS')
      .insert(function () {
        this.select(machineId, maxVersion, 'COMMANDNO', 'ALARMINDEX', 'ALARMNO', 'ALARM', 'UNIVERSALALARMNO')
          .from('BFMASTERCOMMANDSALARMS')
          .where('MACHINEID', '=', machineId)
      })

    await trx('BAMASTERCOMMANDRETURNVALUES')
      .insert(function () {
        this.select(machineId, maxVersion, 'COMMANDNO', 'RETURNVALUEINDEX', 'RETURNVALUENAME', 'CANSHOW', 'SPRELATION')
          .from('BFMASTERCOMMANDRETURNVALUES')
          .where('MACHINEID', '=', machineId)
      })

    await trx('BACOMMANDINPUTOUTPUTS')
      .insert(function () {
        this.select(machineId, maxVersion, 'COMMANDNO', 'IOINDEX', 'IOID', 'IOTYPE', 'NAME')
          .from('BFCOMMANDINPUTOUTPUTS')
          .where('MACHINEID', '=', machineId)
      })

    await trx('BACOMMANDSELECTIONLIST')
      .insert(function () {
        this.select(machineId, maxVersion, 'COMMANDNO', 'IOINDEX', 'SELECTINDEX', 'IOTYPE', 'IOID', 'NAME', 'SELECTEDIOID', 'ISDEFAULT')
          .from('BFCOMMANDSELECTIONLIST')
          .where('MACHINEID', '=', machineId)
      })

    await trx('BACOMMANDPARAMETERS')
      .insert(function () {
        this.select(machineId, maxVersion, 'COMMANDNO', 'PARAMETERINDEX', 'PARAMSTRING', 'VALUE', 'PARAMETERTYPE', 'SELECTIONLIST', 'SELECTIONVALUES', 'UNITCODE', 'PARAMLOWLIMIT', 'PARAMHIGHLIMIT', 'CONTAINSVARIABLE', 'TEMPERATURE', 'USEDEFAULT', 'ISCOMMANDVARIABLE', 'TBBFORMUL', 'USEFORMULA')
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
    await trx('BFERPPARAMETERDEFINITIONS')
      .where('MACHINEID', machineId)
      .del()

    await trx.raw(`
  INSERT INTO BFERPPARAMETERDEFINITIONS (PARAMID, PARAMNAME, PARAMTYPE, MACHINEID) SELECT (SELECT ISNULL(MAX(PARAMID), 0)
   FROM BFERPPARAMETERDEFINITIONS WHERE MACHINEID = P.MACHINEID) + ROW_NUMBER() OVER(ORDER BY P.BATCHPARAMETERID ASC)
   AS BATCHPARAMETERID, P.PARAMSTRING, P.PARAMETERTYPE, P.MACHINEID   FROM BFMACHBATCHPARAMETERS P
   LEFT OUTER JOIN BFERPPARAMETERDEFINITIONS E ON (E.MACHINEID = P.MACHINEID AND P.PARAMSTRING = E.PARAMNAME)
    WHERE P.MACHINEID = ${machineId} AND E.PARAMNAME IS NULL ORDER BY P.BATCHPARAMETERID ASC
  `)

    return true
  } catch (error: any) {
    throw new DatabaseQueryError(error.message)
  }
}
