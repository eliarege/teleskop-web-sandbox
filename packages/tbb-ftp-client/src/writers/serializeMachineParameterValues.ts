// '/tbb6500/data/config/makinesabitleriDegerler'

import type { MachineParameter } from '../../../../apps/machines/types'

export function serializeMachineParameterValues(values: MachineParameter[]): string {
  const regexStrings = values.map(value => `"SABIT_${value.id}"=${value.currentValue}.000000`)
  return regexStrings.join('\n')
}
