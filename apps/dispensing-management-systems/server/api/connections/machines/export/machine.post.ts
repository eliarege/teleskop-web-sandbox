import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { from } = getQuery(event)
  const { to } = await readBody(event)

  if (Array.isArray(to)) {
    const promises = to.map((machineId) => {
      const res = dmsDB.raw(`
        INSERT INTO "DISPENSER_MACHINE_CONNECTION" ("dispenser_id", "machine_id")
        SELECT DISTINCT "dispenser_id", CAST(? AS INTEGER) as "machine_id"
        FROM "DISPENSER_MACHINE_CONNECTION"
        WHERE "machine_id" = ?
      `, [machineId, from])
      return res
    })
    await Promise.all(promises)
    return null
  }
})
