/**
 * **Path**: `/tbb6500/data/locks/locks_outputs`
 *
 * **Example**:
 * ```txt
 * 1 3 17 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0
 * ```
 */

const pattern = /^(\d+) (\d+) (.+)$/

export function parseLocksOutput(content: string) {
  const lines = content.split('\n')
  if (!lines)
    return { analogLocks: [], digitalLocks: [] }

  const analogLocks = []
  const digitalLocks = []
  for (const line of lines) {
    const lineMatch = pattern.exec(line)
    if (!lineMatch)
      continue // Skip lines that don't match the basic pattern

    const lockNo = Number(lineMatch[1]) + 1
    const outputType = Number(lineMatch[2])

    if (outputType === 2) {
      // Parse analog output
      const analogOutputs = parseAnalogOutputs(lineMatch[3])
      analogLocks.push({ lockNo, analogOutputs })
    } else if (outputType === 3) {
      // Parse digital output
      const digitalOutputs = parseDigitalOutputs(lineMatch[3])
      digitalLocks.push({ lockNo, digitalOutputs })
    }
  }

  return { analogLocks, digitalLocks }
}

function parseAnalogOutputs(line: string) {
  const analogOutputPattern = /(-?\d+)\s+(-?\d+)/g
  const outputs = []
  let match = analogOutputPattern.exec(line)

  while (match) {
    if (Number(match[1]) !== -1)
      outputs.push({
        outputId: Number(match[1]) + 1,
        percentage: Number(match[2]),
      })
    match = analogOutputPattern.exec(line)
  }
  return outputs
}

function parseDigitalOutputs(line: string) {
  const digitalOutputPattern = /(-?\d+)\s+(-?\d+)/g
  const outputs = []
  let match = digitalOutputPattern.exec(line)

  while (match) {
    if (Number(match[1]) !== -1)
      outputs.push({
        outputId: Number(match[1]) + 1,
        state: Number(match[2]),
      })
    match = digitalOutputPattern.exec(line)
  }
  return outputs
}
