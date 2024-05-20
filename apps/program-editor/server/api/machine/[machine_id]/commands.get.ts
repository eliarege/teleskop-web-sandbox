import { inferBoolean } from 'utils'
import { machineStore } from '~/server/classes/MachineStore'

export default defineEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const query = getQuery(event)
  const machineId = Number.parseInt(machine_id)
  const machine = await machineStore.get(machineId)
  const editable = inferBoolean(query.editable as string, false)
  if (query?.asList) {
    return await machine.getCommandsAsList()
  }
  const commands = await machine.fetchCommands(editable)
  return commands
})
