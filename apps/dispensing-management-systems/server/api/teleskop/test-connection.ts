import { getTeleskopDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const teleskopDB = await getTeleskopDB()
  await teleskopDB.raw('select 1+1 as result').then(() => setResponseStatus(event, 200, 'OK'))
    .catch((err: any) => setResponseStatus(event, 400, err.toString()))
  return event.node.res.end()
})
