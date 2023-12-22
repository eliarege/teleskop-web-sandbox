import type { StopReason } from "../types"

// '/tbb6500/data/config/durusnedenleri'

export function writeStopReason(reasons: StopReason[]): string {
  const regexStrings = reasons.map(reason => `${reason.stopCode} "${reason.stopName}"`)
  return regexStrings.join('\n')
}
