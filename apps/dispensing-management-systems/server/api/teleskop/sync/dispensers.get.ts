import { getTeleskopDB } from '~/server/connectionPool'

const dispenserParams = {
  dispenserId: 'DISPENSERID',
  dispenserName: 'NAME',
  dispenserIP: 'IP',
  lastConsumptionControl: 'lastConsumptionControl',
  dispenserType: 'DISPENSERTYPENO',
  protocol: 'PROTOCOL',
  readConsumptionFromDMS: 'READCONSUMPTIONFROMDMS',
  consumptionFilename: 'CONSUMPTIONFILENAME',
  fileName: 'BDYREQUESTNAME',
  filePath: 'BDYREQUESTPATH',
}
const dispenserTypeParams = {
  dispenserTypeId: 'DISPENSERTYPENO',
  dispenserTypeName: 'NAME',
}
export default defineEventHandler(async () => {
  try {
    const teleskopDB = await getTeleskopDB()

    const dispenserTypes = await teleskopDB('dbo.DYTFDISPENSERTYPE')
      .select(dispenserTypeParams)
    const dispensers = await teleskopDB('dbo.DYTFDISPENSERSETTINGS')
      .select(dispenserParams)
    $fetch('/api/teleskop/sync/dispensers', { method: 'POST', body: { dispensers, dispenserTypes } })
  } catch (e) {
    console.log(e)
    return e
  }
})
