import { dmsDB } from '~/server/connectionPool'
import type { FabricType } from '~/shared/types'

export default defineEventHandler(async () => {
  const fabricTypes: Array<FabricType> = await dmsDB('FABRIC_TYPE').select({
    fabricTypeId: 'fabric_type_id',
    fabricTypeName: 'fabric_type_name',
    fabricTypeNotes: 'fabric_type_notes'
  }).orderBy('fabric_type_id')
  if (!fabricTypes)
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    })
  return fabricTypes
})
