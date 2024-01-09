import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const machine: Machine = await readBody(event)
    const res = await dmsDB('MACHINE').insert({
      machineId: machine.machineId,
      machineName: machine.machineName,
      machineControllerType: machine.controllerType,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
