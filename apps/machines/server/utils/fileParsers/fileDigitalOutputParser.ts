import type { IOOutput } from '~/types'

const pattern = /^(\d+) (\d+) (\d+) "([^"]+)" (\d+) (\d+) (\d+)$/gim
/**
 *   /tbb6500/data/io/sayisaloutput
 * example: 0 1 1 "Otomatik Lambasi" 0 1 0
 */
export function fileDigitalOutputParser(content: string) {
  const outputs = []
  let match = pattern.exec(content)
  while (match !== null) {
    const output: IOOutput = {
      id: match[1],
      card: match[2],
      canal: match[3],
      name: match[4],
      defaultValue: match[5],
      enabled: match[6],
    }
    outputs.push(output)
    match = pattern.exec(content)
  }
  return outputs
}
