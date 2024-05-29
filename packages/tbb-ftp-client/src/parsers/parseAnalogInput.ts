import type { CommandIO } from '../types'

const pattern = /^(\d+) (\d+) (\d+) "([^"]+)" (\d+) (\d+)(?: "([^"]+)"( ?))?$/gim
/**
 * **Path**: `/tbb6500/data/io/analoginput`
 *
 * **Example**:
 * ```txt
 * 7 1 8 "BK2 Seviyesi" 1 7 "KK_seviye.gif"
 * ```
 */
export function parseAnalogInput(content: string) {
  const inputs = []
  let match = pattern.exec(content)
  while (match !== null) {
    const input: Partial<CommandIO> = {
      id: Number.parseInt(match[1]),
      card: Number.parseInt(match[2]),
      channel: Number.parseInt(match[3]),
      name: match[4],
      enabled: Number.parseInt(match[5]),
      plcIO: Number.parseInt(match[6]),
      icon: match[7] ?? '',
    }
    inputs.push(input)
    match = pattern.exec(content)
  }
  return inputs
}
