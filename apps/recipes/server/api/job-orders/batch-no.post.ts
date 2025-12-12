import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { batchNo } = await readBody<{ batchNo: string }>(event)

  // If input is not purely numeric, just acknowledge without updates
  const numericMatch = batchNo.match(/^(\d+)$/)
  if (!numericMatch) {
    return { success: true, updated: false }
  }

  // Fetch all existing batch values from BATCH_PLAN
  const existingBatches = await dmsDB('BATCH_PLAN').select('batch')

  // Build a set of positive integers parsed from existing batch strings
  const numsSet = new Set<number>()
  for (const row of existingBatches) {
    const b = String(row.batch)
    // Extract leading integer or whole-number-only strings
    const m = b.match(/^(\d+)/)
    if (m) {
      const n = Number.parseInt(m[1], 10)
      if (Number.isFinite(n) && n > 0) {
        numsSet.add(n)
      }
    }
  }

  // Find smallest missing positive integer
  let smallestMissing = 1
  while (numsSet.has(smallestMissing)) {
    smallestMissing++
  }

  // Update sequence to the computed smallest missing number
  await dmsDB.raw('SELECT setval(\'batch_number_seq\', ?, false)', [smallestMissing])

  return { success: true, updated: true, nextValue: smallestMissing }
})
