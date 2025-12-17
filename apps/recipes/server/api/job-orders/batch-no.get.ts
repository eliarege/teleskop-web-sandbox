import { dmsDB } from '~/server/connectionPool'

// Compute next available numeric job/batch number on demand by scanning existing batches.
// Returns the smallest missing positive integer as a string.
export default defineEventHandler(async () => {
  const rows = await dmsDB('BATCH_PLAN').select('batch')

  const nums = new Set<number>()
  for (const r of rows as Array<{ batch: string | number }>) {
    const b = String(r.batch)
    const m = b.match(/^\d+/) // leading numeric portion
    if (m) {
      const n = Number.parseInt(m[0], 10)
      if (Number.isFinite(n) && n > 0)
        nums.add(n)
    }
  }

  let smallest = 1
  while (nums.has(smallest)) smallest++

  return String(smallest)
})
