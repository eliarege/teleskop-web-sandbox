import type { IOOutput } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/io/sayisaloutput`
 *
 * **Example**:
 * ```txt
 * 0 1 1 "Otomatik Lambasi" 0 1 0
 * ```
 */
export function parseDigitalOutput(content: string) {
  const lines = splitLines(content)
  const outputs: Omit<IOOutput, 'commandNo' | 'chooseList'>[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const output: Omit<IOOutput, 'commandNo' | 'chooseList'> = {
      id: tokens.get(0, 'integer'),
      card: tokens.get(1, 'integer'),
      channel: tokens.get(2, 'integer'),
      name: tokens.get(3, 'string'),
      defaultValue: tokens.get(4, 'float'),
      enabled: tokens.get(5, 'integer'),
      plcIO: tokens.get(6, 'integer'),
      icon: tokens.get(7, 'string'),
    }
    outputs.push(output)
  }
  return outputs
}
