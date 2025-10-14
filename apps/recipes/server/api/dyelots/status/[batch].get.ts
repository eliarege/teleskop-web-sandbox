import { getDmExchangeDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { batch } = getRouterParams(event)
  const dmExchangeDB = await getDmExchangeDB()
  const res = await dmExchangeDB('Dyelots').where('Dyelot', batch).select({ state: 'State' }).first()

  return res? res.state : -1
})
