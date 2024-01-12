import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async () => {
  try {
    const machines: Array<Machine> = await dmsDB('MACHINE').select({
      machine_id: 'machine_id',
      machine_name: 'machine_name',
      controller_type: 'controller_type',
    })
    return machines
  } catch (e) {
    console.log(e)
    return e
  }
})
