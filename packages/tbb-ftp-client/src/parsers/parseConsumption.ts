import type { Consumption } from '../types'
import { splitLines } from '../utils/common'

/**
 * **Path**:  `/tbb6500/data/config/consumption`
 *
 * **Example**:
 * ```txt
 * WATERTYPE_5_DO=-1
 * ```
 */
export function parseConsumption(content: string) {
  const consumption: Record<string, string | number> = {}
  const lines = splitLines(content)

  for (const line of lines) {
    const [key, value] = line.split('=')
    consumption[key] = Number.isNaN(Number(value)) ? value : Number(value)
  }
  return consumption as unknown as Consumption
}
