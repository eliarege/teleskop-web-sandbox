import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const machine: Machine = await readBody(event)
    const res = await dmsDB('MACHINE').where({
      machineId: machine.machineId,
    }).update({
      machineId: 'machine_id',
      machineName: 'machine_name',
      machineControllerType: 'controller_type',
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
