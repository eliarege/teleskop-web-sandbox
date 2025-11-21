import type { BFMACHBATCHPARAMETERS } from '@teleskop/core'
import type { Knex } from 'knex'

export async function updateTonelloBatchParameters(
  trx: Knex.Transaction,
  machineId: number,
) {
  // Dummy Kg batch parameter
  await trx('BFMACHBATCHPARAMETERS').delete().where({ MACHINEID: machineId })
  await trx('BFMACHBATCHPARAMETERS').insert({
    MACHINEID: machineId,
    BATCHPARAMETERID: 0,
    PARAMSTRING: 'Kg',
    PARAMLOWLIMIT: 0,
    PARAMHIGHLIMIT: 2000,
    BATCHPLANNING: false,
    BATCHSTART: true,
    RECIPE: false,
    DEFAULTVALUE: 0,
    PARAMETERTYPE: 1,
    SELECTIONLIST: 'YOK',
    SELECTIONVALUES: 'YOK',
    UNITCODE: 1,
    ISDELETED: false,
    PARAMSTRINGEn: 'Kg',
    UNITTEXT: 'Kg',
  } satisfies BFMACHBATCHPARAMETERS)
}
