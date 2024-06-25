import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'
import { ErrorCodes } from '~/shared/constants'

export default defineEventHandler(async (event) => {
  const machine: Machine = await readBody(event)
  try {
    const res = await dmsDB('MACHINE').insert({
      machine_id: machine.machineId,
      machine_name: machine.machineName,
      controller_type: machine.controllerType
    })
    return res
  } catch (e: any) {
    if (e.code === ErrorCodes.unique) {
      setResponseStatus(event, 403, 'A Machine with that ID already exists.')
      event.node.res.end()
    }
  }
})
