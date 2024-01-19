import type { Knex } from 'knex'
import type { TbbFtpClient } from 'tbb-ftp-client'
import { chunk } from 'lodash-es'
import { calcIONumber } from '.'

async function replaceRecords(knex: Knex, tableName: string, data, whereObject?: Record<string, any>) {
  const chunks = chunk(data, 50)

  const delQuery = knex(tableName).del()
  if (whereObject)
    delQuery.where(whereObject)

  const insertQuery = knex(tableName)

  await delQuery
  for (const chunk of chunks) {
    await insertQuery.insert(chunk)
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
}

export async function updateAnalogInputs(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const inputs = await tbb.fetchAnalogInputs()
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

  await replaceRecords(trx, 'BFMACHAIN', analogInputs, { MACHINEID: machineId })

  return analogInputs
}

export async function updateAnalogOutputs(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const outputs = await tbb.fetchAnalogOutputs()
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

  await replaceRecords(trx, 'BFMACHAOUT', analogOutputs, { MACHINEID: machineId })

  return analogOutputs
}

export async function updateDigitalInputs(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const inputs = await tbb.fetchDigitalInputs()
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

  await replaceRecords(trx, 'BFMACHDIN', digitalInputs, { MACHINEID: machineId })

  return digitalInputs
}

export async function updateDigitalOutputs(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const outputs = await tbb.fetchDigitalOutputs()
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

  await replaceRecords(trx, 'BFMACHDOUT', digitalOutputs, { MACHINEID: machineId })

  return digitalOutputs
}

export async function updateCounters(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const counters = await tbb.fetchCounters()
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

  await replaceRecords(trx, 'BFMACHCOUNTER', data, { MACHINEID: machineId })

  return counters
}

export async function updateFinishReasons(tbb: TbbFtpClient, trx: Knex) {
  const finishReasons = await tbb.fetchFinishReasons()

  await replaceRecords(trx, 'BFDYLOTFINISHREASONS', finishReasons, undefined)

  return finishReasons
}

export async function updateManualReasons(tbb: TbbFtpClient, trx: Knex) {
  const manualReasons = await tbb.fetchManualReasons()

  await replaceRecords(trx, 'BFMANUALREASONSGENERAL', manualReasons, undefined)

  return manualReasons
}

export async function updateStopReasons(tbb: TbbFtpClient, trx: Knex) {
  const stopReasons = await tbb.fetchStopReasons()

  await replaceRecords(trx, 'BFSTOPREASONS', stopReasons, undefined)

  return stopReasons
}

export async function updateMachineController(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const { productModel, hardwareModel, plcModel } = await tbb.fetchControllerModel()
  const updateQuery = trx('BFMACHINES').where('MACHINEID', machineId).update({
    productModel,
    hardwareModel,
    plcModel,
  })
  await updateQuery
}

export async function updateCommandGroups(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandGroups()
  const data = commands.map((d) => {
    return {
      COMMANDGROUPID: d.commandGroupId,
      NAME: d.name,
      ICON: d.icon,
      MACHINEID: machineId,
    }
  })
  await replaceRecords(trx, 'BFCOMMANDGROUP', data, { MACHINEID: machineId })
  return commands
}
export async function updateUsers(tbb: TbbFtpClient, trx: Knex) {
  const users = await tbb.fetchUsers()
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
  await replaceRecords(trx, 'BFUSERS', data, undefined)
  return users
}

export async function updateCommandsGeneral(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandsGeneral()

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

  await replaceRecords(trx, 'BFMASTERCOMMANDS', data, { MACHINEID: machineId })

  return commands
}

export async function updateCommandGraphic(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandGraphic()

  for (const c of commands) {
    const query = trx('BFMASTERCOMMANDS').where({
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
    await query
  }

  return commands
}

export async function updateMachineParameters(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const parameters = await tbb.fetchMachineParameters()
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

  await replaceRecords(trx, 'BFMACHPARAMETERS', machineParameters, { MACHINEID: machineId })

  return machineParameters
}

export async function updateCommandEditing(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandsEditing()

  for (const command of commands) {
    const query = trx('BFMASTERCOMMANDS').where({
      COMMANDNO: command.commandNo,
      MACHINEID: machineId,
    }).update({
      ADVICELIST: (command.adviceList && command.adviceList.length) ? command.adviceList : -1,
      DONTUSELIST: command.dontUseList,
    })
    await query
  }
  return commands
}

export async function updateCommandFeedback(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commandFeedback = await tbb.fetchCommandFeedback()
  const data = commandFeedback?.map(c => ({
    MACHINEID: machineId,
    COMMANDNO: c.commandNo,
    RETURNVALUEINDEX: Number.parseInt(c.pvNo.split(' ')[1]) - 1,
    RETURNVALUENAME: c.returnValueName,
    CANSHOW: c.canShow,
    SPRELATION: c.SPRelation,
  }))

  await replaceRecords(trx, 'BFMASTERCOMMANDRETURNVALUES', data, { MACHINEID: machineId })

  return commandFeedback
}

export async function updateConsumption(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const consumption = await tbb.fetchConsumption()

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
  await query

  return consumption
}

export async function updateGlobalCommandFormulas(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const formulas = await tbb.fetchGlobalCommandFormulas()
  const data = formulas.map((d) => {
    return {
      machineId,
      ...d,
    }
  })
  await replaceRecords(trx, 'BFCOMMANDFORMULAS', data, { machineId })

  return formulas
}

export async function updateCommandParameters(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandParams()
  const formulas = await tbb.fetchGlobalCommandFormulas()

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

  await replaceRecords(trx, 'BFCOMMANDPARAMETERS', data, { MACHINEID: machineId })

  return data
}
export async function updateCommandAlarmReasons(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commandAlarmReasons = await tbb.fetchCommandAlarmReasons()

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

  await trx('BFCOMMANDTIMEOUTREASONMAP').where('MACHINEID', machineId).del()
  // await trx('BFCOMMANDTIMEOUTREASONS').del()
  await insertIgnoringDuplicates(trx, 'BFCOMMANDTIMEOUTREASONS', timeoutReasons, ['REASONTEXT', 'GROUPID'])

  await trx('BFCOMMANDTIMEOUTREASONMAP').insert(commandMapEntries)

  return timeoutReasons
}

export async function updateCommandAlarms(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandAlarms()
  const functionAlarms = await tbb.fetchFunctionAlarms()

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
        .findIndex(key => alarmObj[key]?.includes(c.alarmNo)) + 1

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

  await replaceRecords(trx, 'BFMASTERCOMMANDSALARMS', commandsAlarmsInserts, { MACHINEID: machineId })

  return functionAlarms
}

export async function updateCommandIO(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const commands = await tbb.fetchCommandIO()

  const inputsOutputs = []
  const selectionList = []

  for (const [index, command] of commands.entries()) {
    for (const [i, c] of command.chooseList.entries()) {
      const commonData = {
        IOINDEX: i,
        MACHINEID: Number.parseInt(machineId),
        COMMANDNO: command.commandNo,
        IOID: Number.parseInt(c.ioId),
      }

      inputsOutputs.push({
        ...commonData,
        NAME: c.name.length ? c.name : 'bos',
        IOTYPE: (c.ioType <= 4 && c.ioType >= 0 && c.name.length > 0) ? 5 : Number.parseInt(c.ioType),
        PROGRAMEDITING: false,
        COMMANDRUN: false,
      })

      selectionList.push({
        ...commonData,
        SELECTINDEX: index,
        IOTYPE: c.ioType,
        NAME: (c.name && c.name.length) ? c.name : c.ioType !== 5 ? await getIOName(machineId, c.ioType, c.ioId, trx) : '',
        SELECTEDIOID: c.ioId,
        ISDEFAULT: c.isDefault,
        MODEL: 'MODEL',
        EXTENTION: 'EXTENTION',
      })
    }
  }

  await replaceRecords(trx, 'BFCOMMANDINPUTOUTPUTS', inputsOutputs, { MACHINEID: machineId })
  await replaceRecords(trx, 'BFCOMMANDSELECTIONLIST', selectionList, { MACHINEID: machineId })

  return selectionList
}

export async function updateLocksInput(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const locks = await tbb.fetchLocksInput()

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

  await replaceRecords(trx, 'BFLOCKSINPUTAIN', analogInputsDB, { MACHINEID: machineId })
  await replaceRecords(trx, 'BFLOCKSINPUTDIN', digitalInputsDB, { MACHINEID: machineId })
  await replaceRecords(trx, 'BFLOCKSINPUTDOUT', digitalOutputsDB, { MACHINEID: machineId })
  await replaceRecords(trx, 'BFLOCKSINPUTCOMMAND', commandsDB, { MACHINEID: machineId })
  await replaceRecords(trx, 'BFLOCKSINPUTKILIT', locksInputDB, { MACHINEID: machineId })
  await replaceRecords(trx, 'BFLOCKSINPUTVIN', virtualInputsDB, { MACHINEID: machineId })

  return virtualInputsDB
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

  await replaceRecords(trx, 'BFLOCKSGENERAL', data, { MACHINEID: machineId })

  return data
}

export async function updateSystem(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const system = await tbb.fetchSystem()

  await trx('BFMACHINESYSTEMPARAMS')
    .where('MachineId', machineId)
    .del()

  for (const key in system) {
    if (Object.prototype.hasOwnProperty.call(system, key)) {
      const value = system[key]
      await trx('BFMACHINESYSTEMPARAMS')
        .insert({
          MachineId: machineId,
          ParamToken: key,
          ParamValue: value,
        })
    }
  }

  return system
}

export async function updateCycleControl(machineId: number, tbb: TbbFtpClient, trx: Knex) {
  const control = await tbb.fetchCycleControl()

  await trx('BFMACHINES')
    .where('MACHINEID', machineId)
    .update({
      REELCOUNT: control[0].reelCount,
    })

  return control
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

  await tbb.uploadStopReasons(formulas)

  return formulas
}
