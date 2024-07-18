import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { from, to } = await readBody(event)
  if (Array.isArray(to)) {
    const promises = to.map((dispenserId) => {
      const res = dmsDB.raw(`
    INSERT INTO "DISPENSER_MACHINE_CONNECTION" ("machine_id", "dispenser_id")
    SELECT DISTINCT "machine_id", CAST(? AS INTEGER) as "dispenser_id"
    FROM "DISPENSER_MACHINE_CONNECTION"
    WHERE "dispenser_id" = ?
    ON CONFLICT ("dispenser_id", "machine_id") DO NOTHING
  `, [dispenserId, from])
      return res
    })
    await Promise.all(promises)
    return null
  }
})
