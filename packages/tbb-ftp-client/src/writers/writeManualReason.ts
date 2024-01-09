import type { ManualReason } from '../types'

export function writeManualReason(reasons: ManualReason[]): string {
  const lines = reasons.map((reason) => {
    return `${reason.manualId} "${reason.manualString}"`
  })

  return lines.join('\n')
}
