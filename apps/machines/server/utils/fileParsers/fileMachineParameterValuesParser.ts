import type { MachineParameter } from '~/types'

const pattern = /^SABIT_(\d+)=(\d+).(\d+)$/gim
/**
 *  '/tbb6500/data/config/makinesabitleriDegerler'
 * example: SABIT_0=4500.000000
 */
export function fileMachineParameterValuesParser(content: string) {
  const machineParameterValues: MachineParameter[] = []
  let match = pattern.exec(content)
  while (match !== null) {
    const id = match[1]
    const values = match[2].split(',')

    const parameter: MachineParameter = {
      id,
      currentValue: values[0],
    }

    machineParameterValues.push(parameter)
    match = pattern.exec(content)
  }
  return machineParameterValues
}
