import type { IOInput } from '~/types'

const pattern = /^(\d+) (\d+) (\d+) "([^"]+)" (\d+) (\d+)$/gim
/**
 *   /tbb6500/data/io/sayac
 * example: 3 1 4 "Su Sayaci" 1 3
 */
export function fileCounterParser(content: string) {
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
