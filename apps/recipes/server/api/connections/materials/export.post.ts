import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { from, to } = await readBody(event)
  if (Array.isArray(to)) {
    const promises = to.map((dispenserId) => {
      const res = dmsDB.raw(`
    INSERT INTO "DISPENSER_MATERIAL_CONNECTION" ("material_code", "dispenser_id")
    SELECT DISTINCT "material_code", CAST(? AS INTEGER) as "dispenser_id"
    FROM "DISPENSER_MATERIAL_CONNECTION"
    WHERE "dispenser_id" = ?
    ON CONFLICT ("dispenser_id", "material_code") DO NOTHING
  `, [dispenserId, from])
      return res
    })
    await Promise.all(promises)
    return null
  }
})
