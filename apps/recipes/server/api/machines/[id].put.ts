import { dmsDB } from '~/server/connectionPool'
import { MachineSchema } from '~/shared/schemas'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const machine: Machine = await readValidatedBody(event, MachineSchema.parse)
  const res = await dmsDB('MACHINE').where({
    machine_id: machine.machineId,
  }).update({
    machine_name: machine.machineName,
    controller_type: machine.controllerType,
  })
  await dmsDB('MACHINE_GROUP').where({
    machine_id: machine.machineId,
  }).update({
    group_id: machine.machineGroup
  })
  return res
})
