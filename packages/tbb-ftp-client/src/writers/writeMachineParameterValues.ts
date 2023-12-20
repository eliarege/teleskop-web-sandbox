// '/tbb6500/data/config/makinesabitleriDegerler'

export function writeMachineParameterValues(values): string {
  const regexStrings = values.map(value => `"SABIT_${value.id}"=${value.currentValue}.000000`)
  return regexStrings.join('\n')
}
