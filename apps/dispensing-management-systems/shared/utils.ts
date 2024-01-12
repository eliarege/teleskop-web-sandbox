import type * as types from './types'

export function convertTeleskopData(data: types.TeleskopData[]) {
  const jobOrders: types.JobOrder[] = data.map((val) => {
    return {
      jobId: val.jobId,
      batchNo: val.batchNo,
      batchCorrectionNo: val.batchCorrectionNo,
      machineName: val.machineName,
      machineId: val.machineId,
      dispenserId: val.dispenserId,
      tankNo: val.tankNo,
      programNo: val.programNo,
      programName: val.programName,
      stepNo: val.stepNo,
      recipeType: val.recipeType,
      recipeProcessNo: val.recipeProcessNo,
      recipeStepNo: val.recipeStepNo,
      status: val.status,
    }
  })

  const dispensers: types.Dispenser[] = []
  const uniqueDispenserIds = new Set()

  data.forEach((val) => {
    if (!uniqueDispenserIds.has(val.dispenserId)) {
      dispensers.push({
        dispenserId: val.dispenserId,
        dispenserName: val.dispenserName,
        dispenserIP: '192.168.17.14',
        dipenserPswrd: '35427',
        lastConsumptionControl: val.lastConsumptionControl,
        dispenserType: val.dispenserType,
        protocol: val.protocol,
        readConsumptionFromDMS: val.readConsumptionFromDMS,
        consumptionFilename: val.consumptionFilename,
        fileName: val.fileName,
        filePath: val.filePath,
      })
      uniqueDispenserIds.add(val.dispenserId)
    }
  })

  const machines: types.Machine[] = []
  const uniqueMachineIds = new Set()
  data.forEach((val) => {
    if (!uniqueMachineIds.has(val.machineId)) {
      machines.push({
        machineId: val.machineId,
        machineName: val.machineName,
        controllerType: val.controllerType,
      })
      uniqueMachineIds.add(val.machineId)
    }
  })

  return { jobOrders, dispensers, machines }
}
