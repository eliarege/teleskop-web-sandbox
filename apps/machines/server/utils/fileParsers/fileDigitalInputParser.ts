import type { IOInput } from '~/types'

const pattern = /^(\d+) (\d+) (\d+) "([^"]+)" (\d+) (\d+)$/gim
/**
 *   /tbb6500/data/io/sayisalinput
 * example: 0 1 1 "1.Goz Uc Bul Sensoru" 1 0
 */
export function fileDigitalInputParser(content: string) {
  const inputs = []
  let match = pattern.exec(content)
  while (match !== null) {
    const input: IOInput = {
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
