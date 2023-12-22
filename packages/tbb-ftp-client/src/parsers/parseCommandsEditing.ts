import type { MasterCommand } from '../types'

const pattern = /^(\d+) ((?:\d+(?:,\d+)*,)*\d?) ((?:\d+(?:,\d+)*,)*\d*) ((?:\d+(?:,\d+)*,)*\d?)$/gim
/**
 *  '/tbb6500/data/commands/editing'
 * example:
 * 1  16,30,31,38,42 1,1,1,1,1
 * 15  16 1
 *"27  58,56,38,36,57,25,21,19 1,1,1,1,1,1,1,1
 */
export function parseCommandsEditing(content: string) {
  const commands = []
  let match = pattern.exec(content)
  while (match !== null) {
    const command: MasterCommand = {
      commandNo: Number.parseInt(match[1]),
      adviceList: match[2],
      dontUseList: match[3],
    }
    commands.push(command)
    match = pattern.exec(content)
  }
  return commands
}
