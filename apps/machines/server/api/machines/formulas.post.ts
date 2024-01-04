import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { filters } = await readBody(event)
    const selectParams = {
      machineId: 'machineId',
      formulaId: 'formulaId',
      formula: 'formula',
      commandNo: 'BFCOMMANDFORMULAS.commandNo',
      commandParameterNo: 'commandParameterNo',
      formulaName: 'formulaName',
      /*    commandName: 'NAME',
      parameterName: 'PARAMSTRING', */
    }
    const query = knex('BFCOMMANDFORMULAS')
      .select(selectParams)
    /*   .leftJoin('BFMASTERCOMMANDS', 'BFMASTERCOMMANDS.COMMANDNO', 'BFCOMMANDFORMULAS.commandNo')
      .leftJoin('BFCOMMANDPARAMETERS', function () {
        this
          .on('BFCOMMANDPARAMETERS.COMMANDNO', 'BFCOMMANDFORMULAS.commandNo')
          .andOn('BFCOMMANDPARAMETERS.PARAMETERINDEX', 'BFCOMMANDFORMULAS.commandParameterNo')
      }) */

    if (filters)
      return await filtersToKnex(filters, selectParams, query)

    return await query
  } catch (e) {
    return e
  }
})
