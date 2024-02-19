import { dmsDB } from '~/server/connectionPool'
import type { Protocol } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const { brandid } = getRouterParams(event)
    const protocols: Array<Protocol> = await dmsDB('PROTOCOL').select({
      protocol: 'protocol',
      fields: 'fields',
    }).where('dispenser_brand_id', brandid)
    return protocols
  } catch (e) {
    console.log(e)
    return e
  }
})
