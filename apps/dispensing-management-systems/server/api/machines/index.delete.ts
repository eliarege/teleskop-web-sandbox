import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const machineId = await readBody(event)
    const res = await dmsDB('MACHINE').where('machine_id', machineId).del()
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
