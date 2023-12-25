const pattern = /^(\d+) "([^"]*)" (.*)$/gim
/**
 * **Path**: `/tbb6500/data/commands/io`
 *
 * **Example**:
 * ```txt
 * 1 "Referans Seçiniz" 4,13 1 4,28 0
 * ```
 */
export function parseCommandIO(content: string) {
  const commands = []
  let match = pattern.exec(content)
  while (match !== null) {
    const command = {
      commandNo: match[1],
    }
    if (match[3]) {
      const groups = match[3].match(/(\d+,\d+ [01])/g)
      command.chooseList = groups.map((g) => {
        const [xy, z] = g.split(' ')
        const [x, y] = xy.split(',')
        return { ioType: x, ioId: y, isDefault: z, name: match[2] }
      })
    }

    commands.push(command)
    match = pattern.exec(content)
  }

  const res = {}
  for (const command of commands) {
    if (!res[command.commandNo]) {
      res[command.commandNo] = {
        commandNo: command.commandNo,
        chooseList: command.chooseList,
      }
    } else {
      res[command.commandNo].chooseList = res[command.commandNo].chooseList.concat(command.chooseList)
    }
  }

  return Object.values(res)
}
