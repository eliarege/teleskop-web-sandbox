import type { FinishReason } from '~/types'

const pattern = /^(\d+) "([^"]+)" "([^"]+)"$/gim
/**
 *  '/tbb6500/data/commands/commandGroup'
 * example: 0 "Komutlar" "grupBoyama.gif"
 */
export function fileCommandGroupParser(content: string) {
  const groups = []
  let match = pattern.exec(content)
  while (match !== null) {
    const group = {
      commandGroupId: match[1],
      name: match[2],
      icon: match[3].split('.')[0],
    }
    groups.push(group)
    match = pattern.exec(content)
  }
  return groups
}
