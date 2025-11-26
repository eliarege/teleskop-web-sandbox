import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { batchNo } = await readBody<{ batchNo: string }>(event)

  // Check if batch number is purely numeric
  const numericMatch = batchNo.match(/^(\d+)$/)

  if (numericMatch) {
    const numericValue = Number.parseInt(numericMatch[1], 10)

    // Update sequence to the next value
    await dmsDB.raw('SELECT setval(\'batch_number_seq\', ?, false)', [numericValue + 1])

    return { success: true, updated: true, nextValue: numericValue + 1 }
  }

  return { success: true, updated: false }
})
