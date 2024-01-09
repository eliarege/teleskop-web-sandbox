import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async () => {
  try {
    const machines: Array<Machine> = await dmsDB('MACHINE').insert({
      machineId: 'machine_id',
      machineName: 'machine_name',
    })
    return machines
  } catch (e) {
    console.log(e)
    return e
  }
})
