import { dmsDB } from '~/server/connectionPool'
import type { Protocol } from '~/shared/types'

export default defineEventHandler(async () => {
  const protocols: Array<Protocol> = await dmsDB('PROTOCOL').select({
    dispenserBrandId: 'dispenser_brand_id',
    protocol: 'protocol',
    fields: 'fields',
  })
  return protocols
})
