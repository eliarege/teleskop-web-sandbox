import { dmsDB } from '~/server/connectionPool'
import type { ContinueJobOrderParams } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { jobNo } = getQuery(event)
  const res: ContinueJobOrderParams = await dmsDB('JOB_ORDER_HEADER')
    .where('job_no', jobNo)
    .select({
      jobNo: 'job_no',
      fabricSize: 'fabric_size',
      fabricWeight: 'fabric_weight',
      grammage: 'grammage',
      colorCode: 'color_code',
      flotte: 'flotte',
      volume: 'volume',
      foulard: 'foulard',
      startDate: 'start_date'
    })
  return res
})
