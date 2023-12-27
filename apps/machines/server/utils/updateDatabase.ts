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
      SELECTIONLIST: (c.selectionList && c.selectionList.length) ? c.selectionList.filter((c, i) => i % 2 === 0).join(' ') : '',
      SELECTIONVALUES: (c.selectionList && c.selectionList.length) ? c.selectionList.filter((c, i) => i % 2 === 1).join(' ') : '',
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

  return data.slice(0, 10)
}
