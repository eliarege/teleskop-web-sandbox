import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { dispenserid } = getRouterParams(event)
    const { added, deleted } = await readBody(event)
    if (deleted.length > 0)
      $fetch(`/api/dispensers/connections/materials/${dispenserid}`, { method: 'DELETE', body: deleted })
    if (added.length > 0) {
      const insertRows = added.map((materialCode: any) => ({
        material_code: materialCode,
        dispenser_id: dispenserid,
      }))
      const res = await dmsDB('DISPENSER_MATERIAL_CONNECTION').insert(insertRows)
      return res
    }
  } catch (e) {
    console.log(e)
    return e
  }
})
