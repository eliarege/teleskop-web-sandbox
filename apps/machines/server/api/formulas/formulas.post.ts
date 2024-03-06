import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { filters } = await readBody(event)

  const selectParams = {
    machineId: 'machineId',
    formulaId: 'formulaId',
    formula: 'formula',
    commandNo: 'BFCOMMANDFORMULAS.commandNo',
    commandParameterNo: 'commandParameterNo',
    formulaName: 'formulaName',
    commandName: 'NAME',
    parameterName: 'BFCOMMANDPARAMETERS.PARAMSTRING',
  }
  const query = knex('BFCOMMANDFORMULAS')
    .select(selectParams)
    .leftJoin('BFMASTERCOMMANDS', function () {
      this
        .on('BFMASTERCOMMANDS.COMMANDNO', 'BFCOMMANDFORMULAS.commandNo')
        .andOn('BFMASTERCOMMANDS.MACHINEID', 'BFCOMMANDFORMULAS.machineId')
    })
    .leftJoin('BFCOMMANDPARAMETERS', function () {
      this
        .on('BFCOMMANDPARAMETERS.COMMANDNO', 'BFCOMMANDFORMULAS.commandNo')
        .andOn('BFCOMMANDPARAMETERS.PARAMETERINDEX', 'BFCOMMANDFORMULAS.commandParameterNo')
        .andOn('BFCOMMANDPARAMETERS.MACHINEID', 'BFCOMMANDFORMULAS.machineId')
    })
  let res
  if (filters)
    res = filtersToKnex(filters, selectParams, query)

  res = await query

  return res.map(r => ({
    ...r,
    commandName: r.commandName ?? null,
    parameterName: r.parameterName ?? null,
  }))
})
