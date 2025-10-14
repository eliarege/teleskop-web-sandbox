import { dmsDB } from '~/server/connectionPool'
import type { Customer } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { customer } = await readBody<{customer: Customer}>(event)
  const res = await dmsDB('CUSTOMER').insert({
    'customer_id' : customer.customerId,
    'customer_no': customer.customerNo,
    'customer_name': customer.customerName,
    'customer_notes': customer.customerNotes
  })
  return res
})

