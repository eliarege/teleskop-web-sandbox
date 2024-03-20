import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const machineId = await readBody(event)
  const res = await dmsDB('MACHINE').where('machine_id', machineId).del()
  return res
})
