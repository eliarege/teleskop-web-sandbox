import type { MachineParameter } from '~/types'

const pattern = /^SABIT_(\d+)=(.+)$/gim
// '../../tbb6500/data/config/makinesabitleri'
export function fileMachineParametersParser(content: string) {
  const machineParameters: MachineParameter[] = []
  let match = pattern.exec(content)
  while (match !== null) {
    const id = match[1]
    const values = match[2].split(',')

    // machineparameterid, paramstring, defaultValue, dmArea,
    // consScreen, paramlowlimit, paramhighlimit, consFormat,
    // paramNo,consUnit

    const parameter: MachineParameter = {
      id,
      paramString: values[0],
      defaultValue: values[1],
      dmArea: values[2],
      consScreen: values[3],
      paramLowLimit: values[4],
      paramHighLimit: values[5],
      consFormat: values[6],
      consUnit: values[8],
    }

    machineParameters.push(parameter)
    match = pattern.exec(content)
  }
  return machineParameters
}
