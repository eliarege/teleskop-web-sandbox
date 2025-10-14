import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const result = await dmsDB('JOB_ORDER')
    .max('batch_no as maxBatchNo')
    .first()

  return (result?.maxBatchNo || 0) + 1
})
