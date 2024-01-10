import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineIds } = await readBody(event)
    const res = await dmsDB('MACHINE').whereIn('machine_id', machineIds).del()
    return res
  } catch (e) {
    return e
  }
})
