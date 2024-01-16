import { dmsDB } from '~/server/connectionPool'
import type { MaterialRequest } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const { jobId } = getQuery(event)
    const materialRequests: MaterialRequest[] = await dmsDB('MATERIAL_REQUEST as r')
      .join(
        'MATERIAL as m',
        'm.material_code',
        '=',
        'r.material_code',
      )
      .where('r.req_no', '=', Number(jobId))
      .select({
        materialName: 'm.material_name',
        materialCode: 'r.material_code',
        amount: 'r.amount',
        status: 'r.status',
      })
    return materialRequests
  } catch (e) {
    console.log(e)
    return e
  }
})
