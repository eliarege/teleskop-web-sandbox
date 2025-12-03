import type { GlobalCommandFormula } from '../types'
import { splitLines, splitOnce } from '../utils/common'

/**
 * **Path**: `/tbb6500/data/config/globalCommandFormulas`
 *
 * **Example**:
 * ```txt
 * GLOBAL_FORMULA_2=Kilo*(AK Boya Oran-Kumastaki Su)-(Soda+Tuz+Boya+Sülfat+Alkali),2,1,0,Boya Suyu
 * ```
 */
export function parseGlobalCommandFormulas(content: string) {
  const commands: GlobalCommandFormula[] = []

  for (const line of splitLines(content)) {
    const [_, value] = splitOnce(line, '=')
    if (!value) {
      continue
    }
    const [
      formula,
      formulaIdStr,
      commandNoStr,
      commandParameterNoStr,
      formulaName,
    ] = value.split(',')

    commands.push({
      formula,
      formulaId: Number.parseInt(formulaIdStr, 10),
      commandNo: Number.parseInt(commandNoStr, 10),
      commandParameterNo: Number.parseInt(commandParameterNoStr, 10),
      formulaName,
    })
  }
  return commands
}

export function serializeGlobalCommandFormulas(formulas: GlobalCommandFormula[]): string {
  const lines = formulas.map((formula, index) => {
    return `GLOBAL_FORMULA_${index + 1}=${[
      formula.formula,
      formula.formulaId,
      formula.commandNo,
      formula.commandParameterNo,
      formula.formulaName,
    ].join(',')}`
  })

  return lines.join('\n')
}
