import type { GlobalCommandFormula } from '../types'

export function serializeGlobalCommandFormulas(formulas: GlobalCommandFormula[]): string {
  const lines = formulas.map((formula, index) => {
    return `GLOBAL_FORMULA_${index + 1}=${formula.formula},${formula.formulaId},${formula.commandNo},${formula.commandParameterNo},${formula.formulaName}`
  })

  return lines.join('\n')
}
