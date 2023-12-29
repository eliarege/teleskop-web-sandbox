import type { Consumption } from '../types'

/**
 *   /tbb6500/data/config/consumption
 * example:WATERTYPE_5_DO=-1
 */
export function parseConsumption(content: string) {
  const consumption: Consumption = {}
  const lines = content.split('\n')

  for (const line of lines) {
    let [key, value] = line.split('=')
    if (key) {
      if (value !== '') {
        value = key.includes('TIME')
          ? value
          : Number.parseInt(value)
      }

      consumption[key] = value
    }
  }

  return consumption
}
