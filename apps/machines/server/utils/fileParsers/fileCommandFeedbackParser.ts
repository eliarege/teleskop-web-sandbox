const pattern = /^(\d+) (\d+) "([^"]*)" "([^"]*)" (\d+) (\d+) ?(\d*)$/gim
/**
 *  '/tbb6500/data/commands/feedback'
 * example: 15 0 "PV 1" "Çalisma Süresi" 1 1
 */
export function fileCommandFeedbackParser(content: string) {
  const groups = []
  let match = pattern.exec(content)
  while (match !== null) {
    const group = {
      commandNo: match[1],
      PVNo: match[3],
      returnValueName: match[4],
      canShow: match[5],
      SPRelation: match[6],
    }
    groups.push(group)
    match = pattern.exec(content)
  }
  return groups
}
