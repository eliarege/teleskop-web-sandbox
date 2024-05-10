import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { status, reqNo } = getQuery(event)
  await dmsDB('JOB_ORDER')
    .where('job_id', reqNo)
    .update({ status })
  await dmsDB('MATERIAL_REQUEST')
    .where('req_no', reqNo)
    .update({ status })
  return null
})
