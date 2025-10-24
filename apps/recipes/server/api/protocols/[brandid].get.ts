import { dmsDB } from '~/server/connectionPool'
import type { Protocol } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { brandid } = getRouterParams(event)
  const protocols: Array<Protocol> = await dmsDB('PROTOCOL').select({
    protocol: 'protocol',
    fields: 'fields',
  }).where('dispenser_brand_id', brandid)
  return protocols
})
