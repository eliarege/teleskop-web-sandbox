import type { IOChangedEvent } from '../types'

const pattern = /^(\d+) (\d+) (\d+)(?: ?)(\d*)(?: ?)(\d*)$/gim
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
  const inputs = []
  let match = pattern.exec(content)
  while (match !== null) {
    const input: Partial<IOChangedEvent> = {
      ioType: Number.parseInt(match[1]),
      ioIndex: Number.parseInt(match[2]),
      difference: Number.parseInt(match[3]),
      period: match[4] ? Number.parseInt(match[4]) : null,
      minPeriod: match[5] ? Number.parseInt(match[5]) : null,
    }

    inputs.push(input)
    match = pattern.exec(content)
  }
  return inputs
}
