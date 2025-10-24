import { dmsDB, getTeleskopDB } from '~/server/connectionPool'

const dispenserParams = {
  dispenser_id: 'DISPENSERID',
  dispenser_name: 'NAME',
  ip_address: 'IP',
  last_consumption_control: 'lastConsumptionControl',
  dispenser_type: 'DISPENSERTYPENO',
  protocol: 'PROTOCOL',
  consumptionFilename: 'CONSUMPTIONFILENAME',
  bodyRequestName: 'BDYREQUESTNAME',
  bodyRequestPath: 'BDYREQUESTPATH',
}
const dispenserTypeParams = {
  dispenser_type_id: 'DISPENSERTYPENO',
  dispenser_type_name: 'NAME',
  dispenser_brand_id: 1,
}
export default defineEventHandler(async () => {
  try {
    const teleskopDB = await getTeleskopDB()
    const dispenserTypes = await teleskopDB('dbo.DYTFDISPENSERTYPE')
      .select(dispenserTypeParams)
    const dispensers = await teleskopDB('dbo.DYTFDISPENSERSETTINGS')
      .select(dispenserParams)
    dispensers.forEach((dispenser: any) => {
      dispenser.protocol_fields = {
        consumptionFilename: dispenser.consumptionFilename,
        bodyRequestName: dispenser.bodyRequestName,
        bodyRequestPath: dispenser.bodyRequestPath,
      }
      delete dispenser.consumptionFilename
      delete dispenser.bodyRequestName
      delete dispenser.bodyRequestPath
    })
    const batchSize = 3000
    await batchInsert(dmsDB, dispenserTypes, batchSize, 'DISPENSER_TYPE', ['dispenser_type_id'])
    await batchInsert(dmsDB, dispensers, batchSize, 'DISPENSER', ['dispenser_id'])
  } catch (e) {
    console.error(e)
    return e
  }
})
