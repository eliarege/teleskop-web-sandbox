import { dmsDB } from '~/server/connectionPool'
import { batchInsert } from '~/shared/utils'

export default defineEventHandler(async (event) => {
  try {
    const teleskopData = await readBody(event)
    const dispensers: any[] = []
    const dispenserTypes: any[] = []

    teleskopData.dispensers?.forEach((data: any) => {
      const dispenser = {
        dispenser_id: data.dispenserId,
        dispenser_name: data.dispenserName,
        ip_address: data.dispenserIP,
        dispenser_type: data.dispenserType,
        protocol: data.protocol,
        last_consumption_control: data.lastConsumptionControl,
        protocol_fields: {
          consumptionFileName: data.consumptionFilename,
          bodyRequestName: data.fileName,
          bodyRequestPath: data.filePath,
        },
      }
      dispensers.push(dispenser)
    })
    teleskopData.dispenserTypes?.forEach((data: any) => {
      const dispenserType = {
        dispenser_type_id: data.dispenserTypeId,
        dispenser_type_name: data.dispenserTypeName,
        dispenser_brand_id: 1,
      }
      dispenserTypes.push(dispenserType)
    })
    const batchSize = 3000
    await batchInsert(dmsDB, dispenserTypes, batchSize, 'DISPENSER_TYPE', 'dispenser_type_id')
    await batchInsert(dmsDB, dispensers, batchSize, 'DISPENSER', 'dispenser_id')
  } catch (e) {
    console.error(e)
    return e
  }
})
