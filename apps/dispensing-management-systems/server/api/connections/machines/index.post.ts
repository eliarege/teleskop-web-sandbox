import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)
    const { added, deleted } = await readBody(event)
    if (deleted.length > 0) {
      $fetch(`/api/connections/machines?machineId=${machineId}`, { method: 'DELETE', body: deleted })
    }
    if (added.length > 0) {
      const insertRows = added.map((dispenserId: any) => ({
        machine_id: machineId,
        dispenser_id: dispenserId,
      }))
      const res = await dmsDB('DISPENSER_MACHINE_CONNECTION').insert(insertRows)
      return res
    }
  } catch (e) {
    console.log(e)
    return e
  }
})
