import type { CommandIO } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/io/sayisalinput`
 *
 * **Example**:
 * ```txt
 * 0 1 1 "1.Goz Uc Bul Sensoru" 1 0
 * ```
 */
export function parseDigitalInput(content: string) {
  const lines = splitLines(content)
  const inputs: Omit<CommandIO, 'commandNo' | 'chooseList'>[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const input: Omit<CommandIO, 'commandNo' | 'chooseList'> = {
      id: tokens.get(0, 'integer'),
      card: tokens.get(1, 'integer'),
      channel: tokens.get(2, 'integer'),
      name: tokens.get(3, 'string'),
      enabled: tokens.get(4, 'integer'),
      plcIO: tokens.get(5, 'integer'),
      icon: tokens.get(6, 'string'),
    }
    inputs.push(input)
  }
  return inputs
}
