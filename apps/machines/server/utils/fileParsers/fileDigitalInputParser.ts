import type { IO } from '~/types'

const pattern = /^(\d+) (\d+) (\d+) "([^"]+)" (\d+) (\d+)$/gim
/**
 *   /tbb6500/data/io/sayisalinput
 * example: 0 1 1 "1.Goz Uc Bul Sensoru" 1 0
 */
export function fileDigitalInputParser(content: string) {
  const inputs = []
  let match = pattern.exec(content)
  while (match !== null) {
    const input: IO = {
      id: Number.parseInt(match[1]),
      card: Number.parseInt(match[2]),
      canal: Number.parseInt(match[3]),
      name: match[4],
      enabled: Number.parseInt(match[5]),
    }
    inputs.push(input)
    match = pattern.exec(content)
  }
  return inputs
}
