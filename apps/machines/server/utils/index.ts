import type { Knex } from 'knex'

export function calcIONumber(ioObject, controllerModel) {
  const { productModel, hardwareModel, plcModel } = controllerModel
  let channelSum
  if (plcModel.includes('RIO'))
    return ioObject.id
  else if (plcModel.includes('RMT')) {
    channelSum = 37
  } else if (['Iris17', 'Tbb6500', 'Tbb6600', 'Tbb7000', 'T7000PLC', 'T7700'].includes(productModel)) {
    channelSum = 84
  } else if (['T7000EPAC', 'T712', 'T7500', '7701ex', 'T711ex'].includes(productModel)) {
    channelSum = 21
  } else
    throw new Error(`unexpected plc model`)
  return (ioObject.card - 1) * channelSum + ioObject.channel - 1
}

export async function getIOName(machineId, type, id, trx: Knex) {
  let tableName
  switch (type) {
    case 0: tableName = 'BFMACHAIN'; break
    case 1: tableName = 'BFMACHAOUT'; break
    case 2: tableName = 'BFMACHDIN'; break
    case 3: tableName = 'BFMACHDOUT'; break
    case 4: tableName = 'BFMACHCOUNTER'; break
    default: throw new Error(`Invalid type: ${type}`)
  }

  const result = await trx(tableName).where({ MACHINEID: machineId, ID: id }).select('NAME')
  return result.length > 0 ? result[0].NAME : ''
}
