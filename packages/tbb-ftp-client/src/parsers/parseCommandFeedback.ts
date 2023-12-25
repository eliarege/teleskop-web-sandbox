import type { FeedbackCommand } from '../types'

const pattern = /^(\d+) (\d+) "([^"]*)" "([^"]*)" (\d+) (\d+) ?(\d*)$/gim
/**
 * **Path**: `/tbb6500/data/commands/feedback`
 *
 * **Example**:
 * ```txt
 * 15 0 "PV 1" "Çalisma Süresi" 1 1
 * ```
 */
export function parseCommandFeedback(content: string) {
  const groups = []
  let match = pattern.exec(content)
  while (match !== null) {
    const group: FeedbackCommand = {
      commandNo: Number.parseInt(match[1]),
      format: Number.parseInt(match[2]),
      pvNo: match[3],
      returnValueName: match[4],
      canShow: Number.parseInt(match[5]),
      SPRelation: Number.parseInt(match[6]),
    }
    groups.push(group)
    match = pattern.exec(content)
  }
  return groups
}
