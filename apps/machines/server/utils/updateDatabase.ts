import type { Knex } from 'knex'
import type { TbbFtpClient } from 'tbb-ftp-client'
import { calcIONumber } from '.'
import { knex } from '~/server/connectionPool'

async function executeTransacted(tableName: string, whereObject?: Record<string, any>, data, trx?) {
  const delQuery = knex(tableName).del()
  if (whereObject)
    delQuery.where(whereObject)

  const insertQuery = knex(tableName)
    .insert(data)

  if (trx) {
    delQuery.transacting(trx)
    insertQuery.transacting(trx)
  }

  await delQuery
  await insertQuery
}

export async function updateAnalogInputs(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
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

  await executeTransacted('BFMACHAIN', { MACHINEID: machineId }, analogInputs, trx)

  return analogInputs
}

export async function updateAnalogOutputs(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
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

  await executeTransacted('BFMACHAOUT', { MACHINEID: machineId }, analogOutputs, trx)

  return analogOutputs
}

export async function updateDigitalInputs(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
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

  await executeTransacted('BFMACHDIN', { MACHINEID: machineId }, digitalInputs, trx)

  return digitalInputs
}

export async function updateDigitalOutputs(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
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

  await executeTransacted('BFMACHDOUT', { MACHINEID: machineId }, digitalOutputs, trx)

  return digitalOutputs
}

export async function updateCounters(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
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

  await executeTransacted('BFMACHCOUNTER', { MACHINEID: machineId }, data, trx)

  return counters
}

export async function updateFinishReasons(tbb: TbbFtpClient, trx?: Knex.Transaction) {
  const finishReasons = await tbb.fetchFinishReasons()

  await executeTransacted('BFDYLOTFINISHREASONS', undefined, finishReasons, trx)

  return finishReasons
}

export async function updateManualReasons(tbb: TbbFtpClient, trx?: Knex.Transaction) {
  const manualReasons = await tbb.fetchManualReasons()

  await executeTransacted('BFMANUALREASONSGENERAL', undefined, manualReasons, trx)

  return manualReasons
}

export async function updateStopReasons(tbb: TbbFtpClient, trx?: Knex.Transaction) {
  const stopReasons = await tbb.fetchStopReasons()

  await executeTransacted('BFSTOPREASONS', undefined, stopReasons, trx)

  return stopReasons
}

export async function updateMachineController(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
  const { productModel, hardwareModel, plcModel } = await tbb.fetchControllerModel()
  const updateQuery = knex('BFMACHINES').where('MACHINEID', machineId).update({
    productModel,
    hardwareModel,
    plcModel,
  })
  if (trx)
    updateQuery.transacting(trx)
  await updateQuery
}

export async function updateCommandGroups(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
  const commands = await tbb.fetchCommandGroups()
  const data = commands.map((d) => {
    return {
      COMMANDGROUPID: d.commandGroupId,
      NAME: d.name,
      ICON: d.icon,
      MACHINEID: machineId,
    }
  })
  await executeTransacted('BFCOMMANDGROUP', { MACHINEID: machineId }, data, trx)
  return commands
}
export async function updateUsers(tbb: TbbFtpClient, trx?: Knex.Transaction) {
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
  await executeTransacted('BFUSERS', undefined, data, trx)
  return users
}

export async function updateCommandsGeneral(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
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

  await executeTransacted('BFMASTERCOMMANDS', { MACHINEID: machineId }, data, trx)

  return commands
}

export async function updateCommandGraphic(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
  const commands = await tbb.fetchCommandGraphic()

  for (const c of commands) {
    const query = knex('BFMASTERCOMMANDS').where({
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
    if (trx)
      query.transacting(trx)
    await query
  }

  return commands
}

export async function updateMachineParameters(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
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

  await executeTransacted('BFMACHPARAMETERS', { MACHINEID: machineId }, machineParameters, trx)

  return machineParameters
}

export async function updateCommandEditing(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
  const commands = await tbb.fetchCommandsEditing()

  for (const command of commands) {
    const query = knex('BFMASTERCOMMANDS').where({
      COMMANDNO: command.commandNo,
      MACHINEID: machineId,
    }).update({
      ADVICELIST: (command.adviceList && command.adviceList.length) ? command.adviceList : -1,
      DONTUSELIST: command.dontUseList,
    })
    if (trx)
      query.transacting(trx)
    await query
  }
  return commands
}
