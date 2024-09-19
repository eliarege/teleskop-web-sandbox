import type { IOChangedEvent } from '../types'

/**
 * **Path**: `/tbb6500/data/config/io_changed_event`
 *
 * **Example**:
 * ```
 * 1 13 10 60 60
 * 2 0 10 60
 * ```
 */
export function parseIOChangedEvent(content: string) {
  const inputs = [] as IOChangedEvent[]

  for (const line of content.split('\n')) {
    if (line) {
      const segment = line.trim().split(/\s+/)
      const ioType = Number.parseInt(segment[0])
      // Calculated Values
      if (ioType === 6) {
        inputs.push({
          ioType,
          ioIndex: Number.parseInt(segment[1]),
          difference: 0,
          period: segment[4] ? Number.parseInt(segment[4]) : null,
          minPeriod: segment[4] ? Number.parseInt(segment[5]) : null,
        })
      } else {
        inputs.push({
          ioType,
          ioIndex: Number.parseInt(segment[1]),
          difference: Number.parseInt(segment[2]),
          period: segment[3] ? Number.parseInt(segment[3]) : null,
          minPeriod: segment[4] ? Number.parseInt(segment[4]) : null,
        })
      }
    }
  }

  return inputs
}
