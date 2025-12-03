import type { MachineParameter } from '../types'
import { splitLines } from '../utils/common'

const pattern = /^SABIT_(\d+)=/i
/**
 * **Path**: `/tbb6500/data/config/makinesabitleriDegerler`
 *
 * **Example**:
 * ```txt
 * SABIT_0=4500.000000
 * ```
 */
export function parseMachineParameterValues(content: string) {
  const machineParameterValues: Partial<MachineParameter>[] = []

  for (const line of splitLines(content)) {
    const match = pattern.exec(line)
    if (!match)
      continue

    const id = match[1]
    const value = line.slice(match[0].length)

    if (value) {
      machineParameterValues.push({
        machineParameterId: Number.parseInt(id),
        currentValue: Number.parseFloat(value),
      })
    }
  }
  return machineParameterValues
}

export function serializeMachineParameterValues(values: MachineParameter[]): string {
  const regexStrings = values.map(value => `"SABIT_${value.machineParameterId}"=${value.currentValue.toFixed(6)}`)
  return regexStrings.join('\n')
}
