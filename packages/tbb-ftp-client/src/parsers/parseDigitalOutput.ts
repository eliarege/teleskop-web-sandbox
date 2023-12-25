import type { IOOutput } from '../types'

const pattern = /^(\d+) (\d+) (\d+) "([^"]+)" (.+) (\d+) (\d+)(?: "([^"]+)")?$/gim
/**
 * **Path**: `/tbb6500/data/io/sayisaloutput`
 *
 * **Example**:
 * ```txt
 * 0 1 1 "Otomatik Lambasi" 0 1 0
 * ```
 */
export function parseDigitalOutput(content: string) {
  const outputs = []
  let match = pattern.exec(content)
  while (match !== null) {
    const output: IOOutput = {
      id: Number.parseInt(match[1]),
      card: Number.parseInt(match[2]),
      channel: Number.parseInt(match[3]),
      name: match[4],
      defaultValue: Number.parseFloat(match[5]),
      enabled: Number.parseInt(match[6]),
      plcIO: Number.parseInt(match[7]),
      icon: match[8] ?? '',
    }
    outputs.push(output)
    match = pattern.exec(content)
  }
  return outputs
}
