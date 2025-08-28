import { inferBoolean } from '@teleskop/utils'
import { MachineController } from '~/server/classes/MachineController'
import { T7ProgramClient } from '~/server/classes/ProgramClient'
import { PError } from '~/server/error'
import { getMachineHost } from '~/server/functions'
import logger from '~/server/logger'

export default defineAuthEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const machineId = Number(machine_id)

  if (!Number.isInteger(machineId)) {
    throw new PError('INVALID_MACHINE_OR_PROGRAM_NUMBER', { machineId, programNo: 0 })
  }

  const query = getQuery(event)
  const host = await getMachineHost(machineId)
  const client = new T7ProgramClient(machineId, host)
  const machine = new MachineController(machineId, client)
  if (!machine) {
    throw new PError('MACHINE_NOT_FOUND', { machineId })
  }

  const editable = inferBoolean(query.editable as string, false)
  const machineInfo = await machine.getMachineInfo(editable)
  logger.info(`User: ${event.context.kauth?.name}. Fetching machine ${machineId}.`)

  return machineInfo
})
