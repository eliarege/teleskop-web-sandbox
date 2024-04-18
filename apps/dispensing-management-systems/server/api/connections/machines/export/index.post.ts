import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { from } = getQuery(event)
  const { to } = await readBody(event)
  if (Array.isArray(to)) {
    const promises = to.map((dispenserId) => {
      const res = dmsDB.raw(`
    INSERT INTO "DISPENSER_MACHINE_CONNECTION" ("machine_id", "dispenser_id")
    SELECT DISTINCT "machine_id", CAST(? AS INTEGER) as "dispenser_id"
    FROM "DISPENSER_MACHINE_CONNECTION"
    WHERE "dispenser_id" = ?
  `, [dispenserId, from])
      return res
    })
    await Promise.all(promises)
    setResponseStatus(event, 200)
    return event.node.res.end()
  }
})
