const pattern = /^(\d+) "([^"]*)" (.*)$/gim
/**
 * **Path**: `/tbb6500/data/commands/io`
 *
 * **Example**:
 * ```txt
 * 1 "Referans Seçiniz" 4,13 1 4,28 0
 * ```
 */

interface CommandIOGroup {
  selectIndex: number
  ioType: number
  ioId: number
  ioIndex: number
  isDefault: number
  name: string
  isChoosableIO: boolean
}
interface Command {
  commandNo: number
  chooseList: CommandIOGroup[]
}
function getLastIOIndex(acc: { [key: number]: Command }, command: Command) {
  return acc[command.commandNo].chooseList[acc[command.commandNo].chooseList.length - 1].ioIndex
}

export function parseCommandIO(content: string) {
  const commands: Partial<Command>[] = []
  let match = pattern.exec(content)
  while (match !== null) {
    const command: Pick<Command, 'commandNo'> = {
      commandNo: Number.parseInt(match[1]),
    }
    if (match) {
      const groups = match[3].match(/(\d+,\d+ [01])/g)
      if (groups) {
        (command as Command).chooseList = groups.map((g, selectIndex) => {
          const [xy, z] = g.split(' ')
          const [x, y] = xy.split(',')
          return { selectIndex, ioType: Number.parseInt(x), ioId: Number.parseInt(y), isDefault: Number.parseInt(z), name: match![2], isChoosableIO: (groups.length > 1) } as Exclude<CommandIOGroup, 'ioIndex'>
        })
        commands.push(command)
      }
    }

    match = pattern.exec(content)
  }

  const res: {
    [key: number]: Command
  } = {}
  for (const command of commands as Command[]) {
    if (!res[command.commandNo]) {
      res[command.commandNo] = {
        commandNo: command.commandNo,
        chooseList: command.chooseList.map(c => ({ ...c, ioIndex: 0 })),
      }
    } else {
      res[command.commandNo].chooseList = res[command.commandNo].chooseList.concat(command.chooseList.map(c => ({ ...c, ioIndex: getLastIOIndex(res, command) + 1 })))
    }
  }

  return Object.values(res)
}
