/**
 * **Path**: `/tbb6500/data/config/sistem`
 *
 * **Example**:
 * ```
 * BATCH_NO_DIGIT_COUNT=0
 * ```
 */

const pattern = /^(.+)=(.+)$/

export function parseSystem(content: string) {
  const res = {}
  const lines = content.split('\n')

  if (lines && lines.length) {
    lines.forEach((line) => {
      const match = line.match(pattern)
      if (match) {
        const key = match[1]
        const value = match[2]
        res[key] = value
      }
    })
  }

  return res
}

export function serializeSystem(data: Record<string, string>) {
  let content = ''
  for (const key in data) {
    const value = data[key]
    content += `${key}=${value}\n`
  }
  return content
}
