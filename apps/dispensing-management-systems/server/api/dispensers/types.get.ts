import { dmsDB } from '~/server/connectionPool'
import type { DispenserType } from '~/shared/types'

export default defineEventHandler(async () => {
  try {
    const dispenserTypes: Array<DispenserType> = await dmsDB('DISPENSER_TYPE').select({
      dispenserTypeId: 'dispenser_type_id',
      dispenserTypeName: 'dispenser_type_name',
    })
      .orderBy('dispenser_type_id')
    return dispenserTypes
  } catch (e) {
    console.log(e)
    return e
  }
})
