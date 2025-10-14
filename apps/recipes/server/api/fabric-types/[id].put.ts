import { dmsDB } from '~/server/connectionPool'
import type { FabricType } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { fabricType } = await readBody<{ fabricType: FabricType }>(event)
  const res = await dmsDB('FABRIC_TYPE').update({
    fabric_type_name: fabricType.fabricTypeName,
    fabric_type_notes: fabricType.fabricTypeNotes,
  }).where('fabric_type_id', fabricType.fabricTypeId)
  return res
})
