export function calcIONumber(ioObject, controllerModel) {
  const { productModel, hardwareModel, plcModel } = controllerModel
  let ioNumber
  let channelSum
  if (plcModel.includes('RIO'))
    ioNumber = ioObject.id
  else if (plcModel.includes('RMT')) {
    channelSum = 37
  } else if (['Iris17', 'Tbb6500', 'Tbb6600', 'Tbb7000', 'T7000PLC', 'T7700'].includes(productModel)) {
    channelSum = 84
  } else if (['T7000EPAC', 'T712', 'T7500', '7701ex', 'T711ex'].includes(productModel)) {
    channelSum = 21
  }
  ioNumber = (ioObject.card - 1) * channelSum + ioObject.canal - 1

  return ioNumber
}
