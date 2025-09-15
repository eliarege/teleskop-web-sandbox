import type { Knex } from 'knex'
import type {
  BFMACHAIN,
  BFMACHAOUT,
  BFMACHCOUNTER,
  BFMACHDIN,
  BFMACHDOUT,
  TonelloInputOutputList,
} from '@teleskop/core'
import { insertBatch } from '@teleskop/utils'

export async function updateTonelloInputOutputs(
  trx: Knex.Transaction,
  machineId: number,
  ioList: TonelloInputOutputList,
) {
  const analogInputs: BFMACHAIN[] = ioList.analogInputs.map(
    (ain, index) => ({
      MACHINEID: machineId,
      ID: index,
      CARD: 0,
      CANAL: 0,
      NAME: ain.label,
      ENABLED: true,
      ISDELETED: false,
    }),
  )
  const analogOutputs: BFMACHAOUT[] = ioList.analogOutputs.map(
    (aout, index) => ({
      MACHINEID: machineId,
      ID: index,
      CARD: 0,
      CANAL: 0,
      NAME: aout.label,
      DEFAULTVALUE: 0,
      ENABLED: true,
      ISDELETED: false,
    }),
  )
  const digitalInputs: BFMACHDIN[] = ioList.digitalsInputs.map(
    (din, index) => ({
      MACHINEID: machineId,
      ID: index,
      CARD: 0,
      CANAL: 0,
      NAME: din.label,
      ENABLED: true,
      ISDELETED: false,
    }),
  )
  const digitalOutputs: BFMACHDOUT[] = ioList.digitalsOutputs.map(
    (dout, index) => ({
      MACHINEID: machineId,
      ID: index,
      CARD: 0,
      CANAL: 0,
      NAME: dout.label,
      DEFAULTVALUE: 0,
      ENABLED: true,
      ISDELETED: false,
    } satisfies BFMACHDOUT),
  )
  const counters: BFMACHCOUNTER[] = ioList.counters.map(
    (cnt, index) => ({
      MACHINEID: machineId,
      ID: index,
      CARD: 0,
      CANAL: 0,
      NAME: cnt.label,
      ENABLED: true,
      ISDELETED: false,
    }),
  )

  await trx('BFMACHAIN').delete().where({ MACHINEID: machineId })
  await trx('BFMACHAOUT').delete().where({ MACHINEID: machineId })
  await trx('BFMACHDIN').delete().where({ MACHINEID: machineId })
  await trx('BFMACHDOUT').delete().where({ MACHINEID: machineId })
  await trx('BFMACHCOUNTER').delete().where({ MACHINEID: machineId })

  await insertBatch(trx, 'BFMACHAIN', analogInputs)
  await insertBatch(trx, 'BFMACHAOUT', analogOutputs)
  await insertBatch(trx, 'BFMACHDIN', digitalInputs)
  await insertBatch(trx, 'BFMACHDOUT', digitalOutputs)
  await insertBatch(trx, 'BFMACHCOUNTER', counters)
}
