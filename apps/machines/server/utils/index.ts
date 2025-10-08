import type { Knex } from 'knex'
import type { CommandIO, IOOutput, Machine } from '~/types'

export function calcIONumber(ioObject: Pick<IOOutput | CommandIO, 'id' | 'card' | 'channel'>, controllerModel: Pick<Machine, 'productModel' | 'hardwareModel' | 'plcModel'>, ioName: string) {
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
  } else if (['Iris17', 'Tbb6500', 'Tbb6600', 'Tbb7000', 'T7000PLC', 'T7700', 'T710'].includes(productModel)) {
    switch (ioName) {
      case 'analog input': channelSum = 8; break
      case 'analog output': channelSum = 8; break
      case 'digital input': channelSum = 32; break
      case 'digital output': channelSum = 16; break
      case 'counter': channelSum = 4; break
      default: throw new Error(`Invalid type: ${ioName}`)
    }
  } else if (['T7000EPAC', 'T712', 'T7500', 'T7701ex', 'T711ex'].includes(productModel)) {
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

export async function getIONames(machineId: number, trx: Knex) {
  const tables = [
    { name: 'BFMACHAIN', type: 0 },
    { name: 'BFMACHAOUT', type: 1 },
    { name: 'BFMACHDIN', type: 2 },
    { name: 'BFMACHDOUT', type: 3 },
    { name: 'BFMACHCOUNTER', type: 4 },
  ] as const

  const ioNames: Record<number, { id: number, name: string }[]> = {}

  for (const table of tables) {
    ioNames[table.type] = await trx
      .from(table.name)
      .select({ id: 'ID', name: 'NAME' })
      .where({ MACHINEID: machineId })
  }

  return ioNames
}
