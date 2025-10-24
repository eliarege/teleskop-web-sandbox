import { dmsDB } from '~/server/connectionPool'
import type { Customer } from '~/shared/types'

export default defineEventHandler(async () => {
  const customers: Array<Customer> = await dmsDB('CUSTOMER').select({
    customerId: 'customer_id',
    customerName: 'customer_name',
    customerNo: 'customer_no',
    customerNotes: 'customer_notes'
  }).orderBy('customer_id')
  if (!customers)
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    })
  return customers
})
