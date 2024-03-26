import type { Consumption } from '../types'

/**
 * /tbb6500/data/config/consumption
 *
 * example:WATERTYPE_5_DO=-1
 */
export function parseConsumption(content: string) {
  const consumption: Record<string, string | number> = {}
  const lines = content.split('\n')

  if (lines && lines.length) {
    for (const line of lines) {
      const [key, value] = line.split('=')
      if (key) {
        if (value !== '') {
          consumption[key] = key.includes('TIME')
            ? value
            : Number.parseInt(value)
        }
      }
    }
  }

  return consumption as unknown as Consumption
}
