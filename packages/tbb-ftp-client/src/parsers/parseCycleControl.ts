const pattern = /^CYCLE_GOZ_SAYISI=(\d+)$/im

/**
 * **Path**: `/tbb6500/data/config/manuel/cycle_kontrol`
 *
 * **Example**:
 * ```
 * CYCLE_GOZ_SAYISI=3
 * ```
 */
export function parseCycleControl(content: string) {
  const match = pattern.exec(content)
  return {
    reelCount: match ? Number.parseInt(match[1]) : 0,
  }
}
