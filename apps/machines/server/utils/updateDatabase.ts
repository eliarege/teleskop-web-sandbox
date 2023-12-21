import type { Knex } from 'knex'
import type FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

async function executeTransacted(tableName: string, machineId: number, data, trx?) {
  const delQuery = knex(tableName)
    .where('MACHINEID', machineId)
    .del()

  const insertQuery = knex(tableName)
    .insert(data)
  if (trx) {
    delQuery.transacting(trx)
    insertQuery.transacting(trx)
  }
  await delQuery
  await insertQuery
}

export async function updateAnalogInputs(machineId: number, tbb: FTPClient, trx?: Knex.Transaction) {
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

  await executeTransacted('BFMACHAIN', machineId, analogInputs, trx)

  return analogInputs
}

export async function updateAnalogOutputs(machineId: number, tbb: FTPClient, trx?: Knex.Transaction) {
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

  await executeTransacted('BFMACHAOUT', machineId, analogOutputs, trx)

  return analogOutputs
}

export async function updateDigitalInputs(machineId: number, tbb: FTPClient, trx?: Knex.Transaction) {
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

  await executeTransacted('BFMACHDIN', machineId, digitalInputs, trx)

  return digitalInputs
}

export async function updateDigitalOutputs(machineId: number, tbb: FTPClient, trx?: Knex.Transaction) {
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

  await executeTransacted('BFMACHDOUT', machineId, digitalOutputs, trx)

  return digitalOutputs
}

export async function updateCounters(machineId: number, tbb: FTPClient, trx?: Knex.Transaction) {
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

  await executeTransacted('BFMACHCOUNTER', machineId, data, trx)

  return counters
}
