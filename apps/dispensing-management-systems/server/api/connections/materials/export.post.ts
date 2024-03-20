import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { from, to } = getQuery(event)
    const res = await dmsDB.raw(`
    INSERT INTO "DISPENSER_MATERIAL_CONNECTION" ("material_code", "dispenser_id")
    SELECT DISTINCT "material_code", CAST(? AS INTEGER) as "dispenser_id"
    FROM "DISPENSER_MATERIAL_CONNECTION"
    WHERE "dispenser_id" = ?
  `, [to, from])
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
