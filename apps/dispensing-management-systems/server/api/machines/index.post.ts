import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const machine: Machine = await readBody(event)
    const res = await dmsDB('MACHINE').insert({
      machine_id: machine.machineId,
      machine_name: machine.machineName,
      controller_type: machine.controllerType,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
