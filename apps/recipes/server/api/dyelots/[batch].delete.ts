import { getDmExchangeDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { batch } = getRouterParams(event)
  const dmExchangeDB = await getDmExchangeDB()

  await dmExchangeDB('Dyelots').where('Dyelot', batch).del()
  await dmExchangeDB('Dyelot_Recipe').where('Dyelot', batch).del()
  await dmExchangeDB('Dyelot_Procedure').where('Dyelot', batch).del()

  return event.node.res.end()
})
