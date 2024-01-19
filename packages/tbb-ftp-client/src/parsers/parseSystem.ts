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
  content.split('\n').forEach((line) => {
    const match = line.match(pattern)
    if (match) {
      const key = match[1]
      const value = match[2]
      res[key] = value
    }
  })
  return res
}
