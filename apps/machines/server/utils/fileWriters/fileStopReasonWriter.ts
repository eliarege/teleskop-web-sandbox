import type { MachineStopReason } from '~/types'

// '/tbb6500/data/config/durusnedenleri'

export function fileStopReasonWriter(reasons: MachineStopReason[]): string {
  const regexStrings = reasons.map(reason => `${reason.stopCode} "${reason.stopName}"`)
  return regexStrings.join('\n')
}
