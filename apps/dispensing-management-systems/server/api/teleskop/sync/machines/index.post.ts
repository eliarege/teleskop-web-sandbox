import { dmsDB } from '~/server/connectionPool'
import { batchInsert } from '~/shared/utils'

export default defineEventHandler(async (event) => {
  try {
    const teleskopData = await readBody(event)
    const machines: any[] = []

    teleskopData.machines?.forEach((data: any) => {
      const machine = {
        machine_id: data.machineId,
        machine_name: data.machineName,
        controller_type: data.controllerType,
      }
      machines.push(machine)
    })
    const batchSize = 3000
    await batchInsert(dmsDB, machines, batchSize, 'MACHINE', 'machine_id')
  } catch (e) {
    console.error(e)
    return e
  }
})
