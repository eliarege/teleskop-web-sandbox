const pattern = /^CYCLE_GOZ_SAYISI=(\d+)$/gim

/**
 * **Path**: `/tbb6500/data/config/manuel/cycle_kontrol`
 *
 * **Example**:
 * ```
 * CYCLE_GOZ_SAYISI=3
 * ```
 */
export function parseCycleControl(content: string) {
  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    const reason = {
      reelCount: Number.parseInt(match[1]),
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}
