import type { IOInput, IOOutput } from '~/types'

export function calcIONumber(ioObject: IOInput | IOOutput, controllerModel) {
  const { ProductModel, HardwareModel, PlcModel } = controllerModel
  let ioNumber
  let channelSum
  if (PlcModel.includes('RIO'))
    ioNumber = ioObject.id
  else if (PlcModel.includes('RMT')) {
    channelSum = 37
  } else if (['Iris17', 'Tbb6500', 'Tbb6600', 'Tbb7000', 'T7000PLC', 'T7700'].includes(ProductModel)) {
    channelSum = 84
  } else if (['T7000EPAC', 'T712', 'T7500', '7701ex', 'T711ex'].includes(ProductModel)) {
    channelSum = 21
  }
  ioNumber = (ioObject.card - 1) * channelSum + ioObject.canal - 1

  return ioNumber
}
