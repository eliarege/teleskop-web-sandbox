import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { materialCode } = getQuery(event)
    const { added, deleted } = await readBody(event)
    if (deleted.length > 0) {
      $fetch(`/api/connections/materials?materialCode=${materialCode}`, { method: 'DELETE', body: deleted })
    }
    if (added.length > 0) {
      const insertRows = added.map((dispenserId: any) => ({
        material_code: materialCode,
        dispenser_id: dispenserId,
      }))
      const res = await dmsDB('DISPENSER_MATERIAL_CONNECTION').insert(insertRows)
      return res
    }
  } catch (e) {
    console.log(e)
    return e
  }
})
