import { BatchParameterType, type BFMACHBATCHPARAMETERS } from '@teleskop/core'
import type { Knex } from 'knex'
import type { MssqlError } from '~/server/error'
import { DatabaseQueryError } from '~/server/error'

export async function updateTonelloBatchParameters(
  trx: Knex.Transaction,
  machineId: number,
) {
  // Dummy Kg batch parameter
  try {
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
      DEFAULTVALUE: -9999,
      PARAMETERTYPE: BatchParameterType.FabricWeight,
      SELECTIONLIST: 'YOK',
      SELECTIONVALUES: 'YOK',
      UNITCODE: 1,
      ISDELETED: false,
      PARAMSTRINGEn: 'Kg',
      UNITTEXT: 'Kg',
    } satisfies BFMACHBATCHPARAMETERS)
  } catch (error) {
    throw new DatabaseQueryError('Failed to update Tonello batch parameters', {
      cause: error as AggregateError | MssqlError,
    })
  }
}
