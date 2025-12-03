import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/kalibrasyon/sayackalibrasyon`
 *
 * **Example**:
 * ```txt
 * 2 2 kWh 100
 * 3 0 lt 9.700
 * ```
 */
export function parseCalibrationCounter(content: string) {
  const lines = splitLines(content)
  const inputs: { id: number, format: number, unit: string, pulse: number }[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const input = {
      id: tokens.get(0, 'integer'),
      format: tokens.get(1, 'integer'),
      unit: tokens.get(2, 'string'),
      pulse: tokens.get(3, 'float'),
    }
    inputs.push(input)
  }
  return inputs
}
