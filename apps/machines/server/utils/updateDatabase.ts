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

export default async function updateAnalogInputs(machineId: number, tbb: FTPClient, trx?: Knex.Transaction) {
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
