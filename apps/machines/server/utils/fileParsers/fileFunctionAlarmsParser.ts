const pattern = /^(f(.*)|istek) S=(.*) E=(.*) O=(.*)(?: M=(.*))?$/gim
/**
 *  '/tbb6500/data/config/function_alarms'
 * example: f9 S=101,102 E=100,103,104,105,106 O=
 */
export function fileFunctionAlarmsParser(content: string) {
  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    let o, m
    if (match[5].includes(' M='))
      [o, m] = match[5].split(' M=')
    else o = match[5]
    const reason = {
      f: match[1],
      s: match[3],
      e: match[4],
      o,
      m,
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}
