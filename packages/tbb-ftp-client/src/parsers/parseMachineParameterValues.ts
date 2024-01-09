import type { MachineParameter } from '../types'

const pattern = /^SABIT_(\d+)=(\d+).(\d+)$/gim
/**
 * **Path**: `/tbb6500/data/config/makinesabitleriDegerler`
 *
 * **Example**:
 * ```txt
 * SABIT_0=4500.000000
 * ```
 */
export function parseMachineParameterValues(content: string) {
  const machineParameterValues: MachineParameter[] = []
  let match = pattern.exec(content)
  while (match !== null) {
    const id = match[1]
    const values = match[2].split(',')

    const parameter: MachineParameter = {
      machineParameterId: Number.parseInt(id),
      currentValue: Number.parseInt(values[0]),
    }

    machineParameterValues.push(parameter)
    match = pattern.exec(content)
  }
  return machineParameterValues
}

export function serializeMachineParameterValues(values: MachineParameter[]): string {
  const regexStrings = values.map(value => `"SABIT_${value.id}"=${value.currentValue}.000000`)
  return regexStrings.join('\n')
}
