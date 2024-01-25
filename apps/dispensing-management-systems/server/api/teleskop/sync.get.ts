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
const batchRecipeStepParams = {
  planKey: 'r.PLANKEY',
  batchNo: 'r.JOBORDER',
  recipeType: 'r.RECIPETYPE',
  processOrder: 'r.RCPINDEX',
  ISN: 'r.REQNO_BATCH',
  mainStep: 'r.MAINSTEP',
  parallelStep: 'r.PARALLELSTEP',
  chemCode: 'r.CHEMCODE',
  programProcessNo: 'r.REQNO_PROG',
  amount: 'r.AMOUNT',
  unit: 'r.otherUnit',
}
const programHeaderParams = {
  machineId: 'MACHINEID',
  programNo: 'PROGNO',
  programName: 'NAME'
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
    const programHeaders = await teleskopDB('dbo.BFMASTERPRGHEADER')
      .select(programHeaderParams)
    const batchRecipeSteps = await teleskopDB('dbo.DYBFBATCHORDERRECIPESTEPS as r')
      .select(batchRecipeStepParams)
    const res = { dispensers, machines, jobOrders, materials, materialReqs, programHeaders, batchRecipeSteps }
    return res
  } catch (e) {
    console.log(e)
    return e
  }
})
