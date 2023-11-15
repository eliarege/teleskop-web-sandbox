import type { AnalogInput } from '~/types'

const pattern = /^(\d+) (\d+) (\d+) "([^"]+)" (\d+) (\d+) "([^"]+)" $/gim
/**
 *   /tbb6500/data/io/analoginput
 * example: 7 1 8 "BK2 Seviyesi" 1 7 "KK_seviye.gif"
 */
export function fileAnalogInputParser(content: string) {
  const inputs = []
  let match = pattern.exec(content)
  while (match !== null) {
    const input: AnalogInput = {
      id: match[1],
      card: match[2],
      canal: match[3],
      name: match[4],
      enabled: match[5],
    }
    inputs.push(input)
    match = pattern.exec(content)
  }
  return inputs
}
