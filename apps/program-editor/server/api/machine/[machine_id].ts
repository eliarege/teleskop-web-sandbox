import { inferBoolean } from '@teleskop/utils'
import { MachineController } from '~/server/classes/MachineController'
import logger from '~/server/logger'

export default defineAuthEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const query = getQuery(event)
  const machineId = Number.parseInt(machine_id)
  const machine = await MachineController.create(machineId)
  const editable = inferBoolean(query.editable as string, false)
  const machineInfo = await machine.getMachineInfo(editable)
  logger.info(`User: ${event.context.kauth?.name}. Fetching machine ${machineId}.`)

  return machineInfo
})
