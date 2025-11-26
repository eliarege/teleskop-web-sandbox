import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const result = await dmsDB.raw('SELECT last_value FROM batch_number_seq')
  const currentValue = result.rows[0]?.last_value

  if (currentValue) {
    return String(currentValue)
  }

  return '1'
})
