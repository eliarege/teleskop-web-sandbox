import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  await dmsDB('CUSTOMER').where('customer_id', id).del()
})

