import type { GlobalCommandFormula } from '../types'

const pattern = /^(?:.+=)(.+),(\d+),(\d+),(\d+),(.+)$/gim
/**
 * **Path**: `/tbb6500/data/config/globalCommandFormulas`
 *
 * **Example**:
 * ```txt
 * GLOBAL_FORMULA_2=Kilo*(AK Boya Oran-Kumastaki Su)-(Soda+Tuz+Boya+Sülfat+Alkali),2,1,0,Boya Suyu
 * ```
 */
export function parseGlobalCommandFormulas(content: string) {
  const commands = []
  let match = pattern.exec(content)
  while (match !== null) {
    const input: GlobalCommandFormula = {
      formula: match[1],
      formulaId: Number.parseInt(match[2]),
      commandNo: Number.parseInt(match[3]),
      commandParameterNo: Number.parseInt(match[4]),
      formulaName: match[5],
    }
    commands.push(input)
    match = pattern.exec(content)
  }
  return commands
}

export function serializeGlobalCommandFormulas(formulas: GlobalCommandFormula[]): string {
  const lines = formulas.map((formula, index) => {
    return `GLOBAL_FORMULA_${index + 1}=${formula.formula},${formula.formulaId},${formula.commandNo},${formula.commandParameterNo},${formula.formulaName}`
  })

  return lines.join('\n')
}
