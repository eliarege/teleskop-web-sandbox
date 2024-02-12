import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { dispenserid } = getRouterParams(event)
    const { added, deleted } = await readBody(event)
    if (deleted.length > 0)
      $fetch(`/api/dispensers/connections/machines/${dispenserid}`, { method: 'DELETE', body: deleted })
    if (added.length > 0) {
      const insertRows = added.map((machineId: any) => ({
        machine_id: machineId,
        dispenser_id: dispenserid,
      }))
      const res = await dmsDB('DISPENSER_MACHINE_CONNECTION').insert(insertRows)
      return res
    }
  } catch (e) {
    console.log(e)
    return e
  }
})
