import { knex } from '~/server/connectionPool'
import type { Formula } from '~/types'

export default defineAuthEventHandler(async (event) => {
  const body = await readBody<Formula>(event)

  await knex('BFCOMMANDFORMULAS')
    .insert({
      machineId: body.machineId,
      formulaId: body.formulaId,
      formula: '',
      commandNo: body.commandNo,
      commandParameterNo: body.parameterIndex || -1,
      formulaName: body.formulaName,
    })
})
