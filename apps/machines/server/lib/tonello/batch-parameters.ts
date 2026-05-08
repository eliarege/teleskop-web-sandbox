import { BatchParameterType, type BFERPPARAMETERDEFINITIONS, type BFMACHBATCHPARAMETERS, type BFMACHBATCHPARAMETERTYPES } from '@teleskop/core'
import type { Knex } from 'knex'
import type { MssqlError } from '~/server/error'
import { DatabaseQueryError } from '~/server/error'

export async function updateTonelloBatchParameters(
  trx: Knex.Transaction,
  machineId: number,
) {
  const paramId = 0
  const paramName = 'Kilo'
  const paramUnit = 'Kg'
  // Dummy Kg batch parameter
  try {
    await trx('BFMACHBATCHPARAMETERS').delete().where({ MACHINEID: machineId })
    await trx('BFMACHBATCHPARAMETERTYPES').delete().where({ MACHINEID: machineId, PARAMID: paramId })
    await trx('BFERPPARAMETERDEFINITIONS').delete().where({ MACHINEID: machineId, PARAMID: paramId })
    await trx('BFMACHBATCHPARAMETERS').insert({
      MACHINEID: machineId,
      BATCHPARAMETERID: paramId,
      PARAMSTRING: paramName,
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
      PARAMSTRINGEn: paramName,
      UNITTEXT: paramUnit,
    } satisfies BFMACHBATCHPARAMETERS)
    await trx('BFMACHBATCHPARAMETERTYPES').insert({
      MACHINEID: machineId,
      PARAMID: paramId,
      PARAMTYPEID: BatchParameterType.FabricWeight,
    } satisfies BFMACHBATCHPARAMETERTYPES)
    await trx('BFERPPARAMETERDEFINITIONS').insert({
      PARAMID: paramId,
      PARAMNAME: paramName,
      PARAMTYPE: BatchParameterType.FabricWeight,
      ERPFIELDNAME: 'Weight',
      PartyNoParam: false,
      PARAMNAMEEn: paramName,
      MACHINEID: machineId,
    } satisfies BFERPPARAMETERDEFINITIONS)
  } catch (error) {
    throw new DatabaseQueryError('Failed to update Tonello batch parameters', {
      cause: error as AggregateError | MssqlError,
    })
  }
}
