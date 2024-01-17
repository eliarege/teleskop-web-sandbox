import { teleskopDB } from '~/server/connectionPool'

const jobOrderParams = {
  jobId: 'j.REQNUMBER',
  batchNo: 'j.BATCHNO',
  batchCorrectionNo: 'j.BATCHCORRECTIONNO',
  dispenserId: 'j.DISPENSERID',
  machineId: 'j.MACHINEID',
  tankNo: 'j.TANKNO',
  programNo: 'j.PROGRAMNO',
  programName: 'p.NAME',
  recipeType: 'j.ACTUALRECIPETYPE',
  recipeProcessNo: 'j.RECIPEINDEX',
  stepNo: 'j.PROGRAMSTEPNO',
  recipeStepNo: 'j.RECIPESTEPNO',
  status: 'j.STATUS',
}
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
const machineParams = {
  machineName: 'MACHINENAME',
  machineId: 'MACHINEID',
  controllerType: 'CONTROLLERTYPE',
}
const materialParams = {
  materialCode: 'MATERIALCODE',
  materialName: 'MATERIALNAME',
  materialGroupNo: 'MADDEGRUPNO',
  density: 'YOGUNLUK',
  ph: 'PH',
  source: 'SOURCE',
  costUnit: 'MALIYETBIRIMI',
  unitCost: 'BIRIMMALIYET',
  reRequestable: 'ReRequestable',
  directTransfer: 'DirectTransfer',
}
const materialRequestParams = {
  materialCode: 'CHEMCODE',
  jobId: 'REQNUMBER',
  amount: 'AMOUNT',
  status: 'STATUS',
}
export default defineEventHandler(async () => {
  try {
    const jobOrders = await teleskopDB('dbo.DYTFCHEMREQUESTS as j')
      .leftJoin('dbo.BFMASTERPRGHEADER as p', (builder) => {
        builder
          .on('j.PROGRAMNO', '=', 'p.PROGNO')
          .andOn('j.MACHINEID', '=', 'p.MACHINEID')
      })
      .select(jobOrderParams)
    const dispensers = await teleskopDB('dbo.DYTFDISPENSERSETTINGS')
      .select(dispenserParams)
    const machines = await teleskopDB('dbo.DYTFMACHINES')
      .select(machineParams)
    const materials = await teleskopDB('dbo.DYTFMATERIAL')
      .select(materialParams)
    const materialReqs = await teleskopDB('dbo.DYTFREQMATERIALS')
      .select(materialRequestParams)
    const res = { dispensers, machines, jobOrders, materials, materialReqs }
    return res
  } catch (e) {
    console.log(e)
    return e
  }
})
