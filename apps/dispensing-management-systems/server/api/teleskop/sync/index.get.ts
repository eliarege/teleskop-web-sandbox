import { getTeleskopDB } from '~/server/connectionPool'

const jobOrderParams = {
  jobId: 'REQNUMBER',
  batchNo: 'BATCHNO',
  batchCorrectionNo: 'BATCHCORRECTIONNO',
  dispenserId: 'DISPENSERID',
  machineId: 'MACHINEID',
  tankNo: 'TANKNO',
  programNo: 'PROGRAMNO',
  recipeType: 'ACTUALRECIPETYPE',
  recipeProcessNo: 'RECIPEINDEX',
  stepNo: 'PROGRAMSTEPNO',
  recipeStepNo: 'RECIPESTEPNO',
  requestTime: 'REQUESTTIME',
  completedTime: 'COMPLETEDTIME',
  status: 'STATUS',
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
  recipeAmount: 'AMOUNT',
  realAmount: 'REALAMOUNT',
  mainStep: 'MAINSTEP',
  parallelStep: 'PARALLELSTEP',
  dispenserId: 'DISPENSERID',
  status: 'STATUS',
}
const dustMaterialParams = {
  materialCode: 'CODE',
  reqNo: 'REQNUMBER',
  recipeAmount: 'AMOUNT',
  realAmount: 'REALAMOUNT',
  mainStep: 'MAINSTEP',
  parallelStep: 'PARALLELSTEP',
}
const dustMaterialRequestParams = {
  reqNo: 'REQNUMBER',
  batchNo: 'BATCHNO',
  queueNo: 'QUEUENO',
  recipeType: 'RECIPETYPE',
  dispenserId: 'DISPENSERID',
  requestTime: 'REQUESTTIME',
  status: 'STATUS',
  correctionNo: 'CORRECTIONNO',
  recipeIndex: 'RECIPEINDEX',
  machineId: 'MACHINEID',
}
const batchPlanParams = {
  planKey: 'PLANKEY',
  batch: 'JOBORDER',
  batchCorrectionNo: 'CORRECTIONNUMBER',
  plannedMachine: 'PLANNEDMACHINE',
  plannedStartDate: 'PLANNEDSTARTTIME',
}
const batchRecipeStepParams = {
  planKey: 'r.PLANKEY',
  batchNo: 'r.JOBORDER',
  recipeType: 'r.RECIPETYPE',
  processOrder: 'r.RCPINDEX',
  ISN: 'r.REQNO_BATCH',
  mainStep: 'r.MAINSTEP',
  parallelStep: 'r.PARALLELSTEP',
  materialCode: 'r.CHEMCODE',
  programProcessNo: 'r.REQNO_PROG',
  amount: 'r.AMOUNT',
  unit: 'r.otherUnit',
}
const batchHeaderParams = {
  planKey: 'PLANKEY',
  recipeIndex: 'RCPINDEX',
  recipeNo: 'RECIPENO',
  recipeType: 'RECIPETYPE',
}
const batchPlanParameterParams = {
  planKey: 'PLANKEY',
  parameter: 'PARAMSTRING',
  paramId: 'BATCHPARAMETERID',
  type: 'PARAMETERTYPE',
  value: 'VALUE',
  unit: 'UNITCODE',
}
const programHeaderParams = {
  machineId: 'MACHINEID',
  programNo: 'PROGNO',
  programName: 'NAME',
}
const dispenserMachineConnectionParams = {
  dispenserId: 'DISPENSERID',
  machineId: 'MACHINEID',
}
const dispenserMaterialConnectionParams = {
  dispenserId: 'DISPENSERID',
  materialCode: 'CHEMCODE',
}
export default defineEventHandler(async () => {
  try {
    const teleskopDB = await getTeleskopDB()

    const dispensers = await teleskopDB('dbo.DYTFDISPENSERSETTINGS')
      .select(dispenserParams)
    const machines = await teleskopDB('dbo.DYTFMACHINES')
      .select(machineParams)
    const materials = await teleskopDB('dbo.DYTFMATERIAL')
      .select(materialParams)
    const materialReqs = await teleskopDB('dbo.DYTFREQMATERIALS')
      .select(materialRequestParams)
    const dustMaterials = await teleskopDB('dbo.DYTFDUSTMATERIALS')
      .select(dustMaterialParams)
    const dustMaterialReqs = await teleskopDB('dbo.DYTFDUSTMATERIALSREQ')
      .select(dustMaterialRequestParams)
    const batchPlans = await teleskopDB('dbo.DYBFBATCHPLAN')
      .select(batchPlanParams)
    const programHeaders = await teleskopDB('dbo.BFMASTERPRGHEADER')
      .select(programHeaderParams)
    const jobOrders = await teleskopDB('dbo.DYTFCHEMREQUESTS')
      .select(jobOrderParams)
    const batchRecipeSteps = await teleskopDB('dbo.DYBFBATCHORDERRECIPESTEPS as r')
      .select(batchRecipeStepParams)
    const batchHeaders = await teleskopDB('dbo.DYBFBATCHORDERRECIPEHEADER')
      .select(batchHeaderParams)
    const batchPlanParameters = await teleskopDB('dbo.DYBFBATCHPLANPARAMETERS')
      .select(batchPlanParameterParams)
    const dispenserMachineConnections = await teleskopDB('dbo.DYTFMACHDISPCONNECTION')
      .select(dispenserMachineConnectionParams)
    const dispenserMaterialConnections = await teleskopDB('dbo.DYTFCHEMDISPCONNECTION')
      .select(dispenserMaterialConnectionParams)
    $fetch('/api/teleskop/sync', { method: 'POST', body: { dispensers } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { machines } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { materials } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { jobOrders } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { materialReqs } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { dustMaterials } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { dustMaterialReqs } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { programHeaders } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { batchRecipeSteps } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { batchHeaders } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { batchPlans } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { batchPlanParameters } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { dispenserMachineConnections } })
    $fetch('/api/teleskop/sync', { method: 'POST', body: { dispenserMaterialConnections } })
  } catch (e) {
    console.log(e)
    return e
  }
})

async function batchSend(data: any, table: string) {
  const batchSize = 10000
  const totalItems = data.length
  const totalBatches = Math.ceil(totalItems / batchSize)
  const batchPromises = []
  for (let batchNumber = 0; batchNumber < totalBatches; batchNumber++) {
    const startIndex = batchNumber * batchSize
    const endIndex = Math.min((batchNumber + 1) * batchSize, totalItems)

    const batchData = data.slice(startIndex, endIndex)

    const batchPromise = Promise.all(batchData.map(async (item: any) => {
      $fetch('/api/teleskop/sync', { method: 'POST', body: { [table]: [item] } })
    }))

    batchPromises.push(batchPromise)

    console.log(`Batch ${batchNumber + 1} of ${totalBatches} processed successfully.`)
  }

  await Promise.all(batchPromises.flat())

  console.log('All batches processed successfully.')
}
