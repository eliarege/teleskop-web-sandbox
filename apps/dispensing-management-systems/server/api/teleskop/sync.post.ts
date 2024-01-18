import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const teleskopData = await readBody(event)
    const machines: any[] = []
    const dispensers: any[] = []
    const jobOrders: any[] = []
    const materials: any[] = []
    const materialReqs: any[] = []

    teleskopData.dispensers.forEach((data: any) => {
      const dispenser = {
        dispenser_id: data.dispenserId,
        dispenser_name: data.dispenserName,
        ip_address: data.dispenserIP,
        password: data.dipenserPswrd,
        dispenser_type: data.dispenserType,
        protocol: data.protocol,
        last_consumption_control: data.lastConsumptionControl,
        read_consumption_from_dms: data.readConsumptionFromDMS,
        consumption_filename: data.consumptionFilename,
        bdy_requestname: data.fileName,
        bdy_requestpath: data.filePath,
      }
      dispensers.push(dispenser)
    })
    teleskopData.machines.forEach((data: any) => {
      const machine = {
        machine_id: data.machineId,
        machine_name: data.machineName,
        controller_type: data.controllerType,
      }
      machines.push(machine)
    })
    teleskopData.jobOrders.forEach((data: any) => {
      const jobOrder = ({
        job_id: data.jobId,
        batch_no: data.batchNo,
        batch_correction_no: data.batchCorrectionNo,
        dispenser_id: data.dispenserId,
        machine_id: data.machineId,
        tank_no: data.tankNo,
        program_no: data.programNo,
        program_name: data.programName,
        recipe_type: data.recipeType,
        recipe_process_no: data.recipeProcessNo,
        recipe_step_no: data.recipeStepNo,
        step_no: data.stepNo,
        status: data.status,
      })
      jobOrders.push(jobOrder)
    })

    teleskopData.materials.forEach((data: any) => {
      const material = ({
        material_code: data.materialCode,
        material_name: data.materialName,
        material_group_no: data.materialGroupNo,
        density: data.density,
        ph: data.ph,
        source: data.source,
        cost_unit: data.costUnit,
        unit_cost: data.unitCost,
        re_requestable: data.reRequestable,
        direct_transfer: data.directTransfer,
      })
      materials.push(material)
    })
    teleskopData.materialReqs.forEach((data: any) => {
      const materialReq = ({
        material_code: data.materialCode,
        req_no: data.jobId,
        amount: data.amount,
        status: data.status,
      })
      materialReqs.push(materialReq)
    })
    const batchSize = 1000

    await dmsDB('JOB_ORDER').del()
    await dmsDB('DISPENSER').del()
    await dmsDB('MACHINE').del()
    await dmsDB('MATERIAL_REQUEST').del()
    await dmsDB('MATERIAL').del()

    await batchInsert(dispensers, batchSize, 'DISPENSER')
    await batchInsert(machines, batchSize, 'MACHINE')
    await batchInsert(jobOrders, batchSize, 'JOB_ORDER')
    await batchInsert(materials, batchSize, 'MATERIAL')
    await batchInsert(materialReqs, batchSize, 'MATERIAL_REQUEST')
  } catch (e) {
    console.error(e)
    return e
  }
})

async function batchInsert(data: any[], batchSize: number, tableName: string) {
  const totalRows = data.length
  const numBatches = Math.ceil(totalRows / batchSize)

  await dmsDB.transaction(async (trx) => {
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize
      const end = Math.min((i + 1) * batchSize, totalRows)
      const batch = data.slice(start, end)
      await trx(tableName).insert(batch)
    }
  })
}
