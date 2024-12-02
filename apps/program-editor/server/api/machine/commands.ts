import { inferBoolean } from '@teleskop/utils'
import { machineStore } from '~/server/classes/MachineStore'
import type { MachineCommand } from '~/shared/types'

export default defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const machineIds = body.machineIds
  const commands: (MachineCommand | Pick<MachineCommand, 'name' | 'commandNo'>)[] = []

  for (const machineId of machineIds) {
    const machine = await machineStore.get(Number(machineId))
    const editable = inferBoolean(body.editable as string, false)
    if (body?.asList)
      commands.push(...(await machine.getCommandsAsList()))
    else
      commands.push(...(await machine.fetchCommands(editable)))
  }

  return commands
})
