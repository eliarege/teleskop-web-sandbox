import type { Knex } from 'knex'
import type TbbFtpClient from 'tbb-ftp-client'
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
  const analogInputs = inputs?.map(d => ({
    MACHINEID: machineId,
    ID: d.id,
    CARD: d.card,
    CANAL: d.canal,
    NAME: d.name,
    ENABLED: d.enabled,
    ISDELETED: false,
  }))

  await executeTransacted('BFMACHAIN', { MACHINEID: machineId }, analogInputs, trx)

  return analogInputs
}

export async function updateAnalogOutputs(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
  const outputs = await tbb.fetchAnalogOutputs()
  const analogOutputs = outputs?.map(d => ({
    MACHINEID: machineId,
    ID: d.id,
    CARD: d.card,
    CANAL: d.canal,
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
  const digitalInputs = inputs?.map(d => ({
    MACHINEID: machineId,
    ID: d.id,
    CARD: d.card,
    CANAL: d.canal,
    NAME: d.name,
    ENABLED: d.enabled,
    ISDELETED: false,
  }))

  await executeTransacted('BFMACHDIN', { MACHINEID: machineId }, digitalInputs, trx)

  return digitalInputs
}

export async function updateDigitalOutputs(machineId: number, tbb: TbbFtpClient, trx?: Knex.Transaction) {
  const outputs = await tbb.fetchDigitalOutputs()

  const digitalOutputs = outputs?.map(d => ({
    MACHINEID: machineId,
    ID: d.id,
    CARD: d.card,
    CANAL: d.canal,
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

  const data = counters?.map(d => ({
    MACHINEID: machineId,
    ID: d.id,
    CARD: d.card,
    CANAL: d.canal,
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
