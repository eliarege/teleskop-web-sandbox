import type { FunctionAlarm } from '../types'

const pattern = /^(f(.*)|istek) S=(.*) E=(.*) O=(.*)(?: M=(.*))?$/gim
/**
 * **Path**: `/tbb6500/data/config/function_alarms`
 *
 * **Example**:
 * ```txt
 * f9 S=101,102 E=100,103,104,105,106 O=
 * ```
 */
export function parseFunctionAlarms(content: string) {
  const alarms = []
  let match = pattern.exec(content)
  while (match !== null) {
    let o, m
    if (match[5].includes(' M='))
      [o, m] = match[5].split(' M=')
    else o = match[5]
    const alarm: FunctionAlarm = {
      f: match[1],
      s: match[3],
      e: match[4],
      o,
      m: m || '',
    }
    alarms.push(alarm)
    match = pattern.exec(content)
  }
  return alarms
}
