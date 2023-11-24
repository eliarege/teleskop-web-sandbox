const pattern = /^(\d+) (\d+) (\d+) -(\d+) "([^"]*)" "([^"]*)" ?$/gim
/**
 *  '/tbb6500/data/commands/alarms'
 * example: 1 100 0 -1 "" "Tanımsız"
 */
export function fileCommandAlarmsParser(content: string) {
  const commands = []
  let match = pattern.exec(content)
  while (match !== null) {
    const command = {
      commandNo: match[1],
      alarmNo: match[2],
      alarm: match[6],
    }
    commands.push(command)
    match = pattern.exec(content)
  }
  return commands
}
