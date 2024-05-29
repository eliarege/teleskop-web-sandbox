import type { Knex } from 'knex'
import type { CommandIO } from 'tbb-ftp-client'
import type { IOOutput, Machine } from '~/types'

export function calcIONumber(ioObject: IOOutput | CommandIO, controllerModel: Pick<Machine, 'productModel' | 'hardwareModel' | 'plcModel'>, ioName: string) {
  const { productModel, plcModel } = controllerModel
  let channelSum
  if (plcModel.includes('RIO'))
    return ioObject.id
  else if (plcModel.includes('RMT')) {
    switch (ioName) {
      case 'analog input': channelSum = 2; break
      case 'analog output': channelSum = 2; break
      case 'digital input': channelSum = 16; break
      case 'digital output': channelSum = 16; break
      case 'counter': channelSum = 1; break
      default: throw new Error(`Invalid type: ${ioName}`)
    }
  } else if (['Iris17', 'Tbb6500', 'Tbb6600', 'Tbb7000', 'T7000PLC', 'T7700'].includes(productModel)) {
    switch (ioName) {
      case 'analog input': channelSum = 8; break
      case 'analog output': channelSum = 8; break
      case 'digital input': channelSum = 32; break
      case 'digital output': channelSum = 16; break
      case 'counter': channelSum = 4; break
      default: throw new Error(`Invalid type: ${ioName}`)
    }
  } else if (['T7000EPAC', 'T712', 'T7500', '7701ex', 'T711ex'].includes(productModel)) {
    switch (ioName) {
      case 'analog input': channelSum = 2; break
      case 'analog output': channelSum = 2; break
      case 'digital input': channelSum = 8; break
      case 'digital output': channelSum = 8; break
      case 'counter': channelSum = 1; break
      default: throw new Error(`Invalid type: ${ioName}`)
    }
  } else
    throw new Error(`unexpected plc model`)
  const res = (ioObject.card - 1) * channelSum + ioObject.channel - 1
  return res
}

export async function getIOName(machineId: number, type: number, id: number, trx: Knex) {
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
