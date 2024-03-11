import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, formula, oldFormulaId } = await readBody(event)

  console.log('oldFormulaId, machineId, formula = ', oldFormulaId, machineId, formula)

  await knex('BFCOMMANDFORMULAS')
    .where({
      machineId,
      formulaId: oldFormulaId,
    })
    .update({
      formula: formula.formula,
      formulaId: formula.formulaId,
      commandNo: formula.commandNo,
      commandParameterNo: formula.commandParameterNo,
      formulaName: formula.formulaName,
    })
})
