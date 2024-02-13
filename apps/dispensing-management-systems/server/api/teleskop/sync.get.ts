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
  recipeAmount: 'AMOUNT',
  realAmount: 'REALAMOUNT',
  mainStep: 'MAINSTEP',
  parallelStep: 'PARALLELSTEP',
  dispenserId: 'DISPENSERID',
  status: 'STATUS',
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
  chemCode: 'r.CHEMCODE',
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
    const batchPlans = await teleskopDB('dbo.DYBFBATCHPLAN')
      .select(batchPlanParams)
    const programHeaders = await teleskopDB('dbo.BFMASTERPRGHEADER')
      .select(programHeaderParams)
    const batchRecipeSteps = await teleskopDB('dbo.DYBFBATCHORDERRECIPESTEPS as r')
      .select(batchRecipeStepParams)
    const batchHeaders = await teleskopDB('dbo.DYBFBATCHORDERRECIPEHEADER')
      .select(batchHeaderParams)
    const dispenserMachineConnections = await teleskopDB('dbo.DYTFMACHDISPCONNECTION')
      .select(dispenserMachineConnectionParams)
    const dispenserMaterialConnections = await teleskopDB('dbo.DYTFCHEMDISPCONNECTION')
      .select(dispenserMaterialConnectionParams)

    batchSend(dispensers, 'dispensers')
    batchSend(machines, 'machines')
    batchSend(materials, 'materials')
    batchSend(jobOrders, 'jobOrders')
    batchSend(materialReqs, 'materialReqs')
    batchSend(batchPlans, 'batchPlans')
    batchSend(programHeaders, 'programHeaders')
    batchSend(batchRecipeSteps, 'batchRecipeSteps')
    batchSend(batchHeaders, 'batchHeaders')
    batchSend(dispenserMachineConnections, 'dispenserMachineConnections')
    batchSend(dispenserMaterialConnections, 'dispenserMaterialConnections')
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
