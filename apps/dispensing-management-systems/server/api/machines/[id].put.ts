import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const machine: Machine = await readBody(event)
    const res = await dmsDB('MACHINE').where({
      machine_id: machine.machineId,
    }).update({
      machine_id: 'machineId',
      machine_name: 'machineName',
      controller_type: 'controllerType',
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
