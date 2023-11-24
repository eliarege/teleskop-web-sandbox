const pattern = /^(\d+) (\d+) "([^"]*)" "([^"]*)" "([^"]*)" "([^"]*)" "([^"]*)"$/gim
/**
 *  '/tbb6500/data/commands/graphic'
 * example: 15 2 "Çalisma Süresi" "Sicaklik" "Gradyan" "5" "Bekleme Süresi"
 */
export function fileCommandGraphicParser(content: string) {
  const groups = []
  let match = pattern.exec(content)
  while (match !== null) {
    const group = {
      commandNo: match[1],
      type: match[2],
      x: match[3],
      y: match[4],
      a: match[5],
      maxA: match[6],
      b: match[7],
    }
    groups.push(group)
    match = pattern.exec(content)
  }
  return groups
}
