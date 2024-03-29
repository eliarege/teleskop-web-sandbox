import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const teleskopData = await readBody(event)
    const machines: any[] = []
    const dispensers: any[] = []
    const jobOrders: any[] = []
    const materials: any[] = []
    const materialReqs: any[] = []
    const dustMaterials: any[] = []
    const dustMaterialReqs: any[] = []
    const batchPlans: any[] = []
    const batchRecipeSteps: any[] = []
    const batchHeaders: any[] = []
    const batchPlanParameters: any[] = []
    const programHeaders: any[] = []
    const dispenserMachineConnections: any[] = []
    const dispenserMaterialConnections: any[] = []

    teleskopData.dispensers?.forEach((data: any) => {
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

    teleskopData.machines?.forEach((data: any) => {
      const machine = {
        machine_id: data.machineId,
        machine_name: data.machineName,
        controller_type: data.controllerType,
      }
      machines.push(machine)
    })
    teleskopData.programHeaders?.forEach((data: any) => {
      const programHeader = {
        machine_id: data.machineId,
        program_no: data.programNo,
        program_name: data.programName,
      }
      programHeaders.push(programHeader)
    })
    teleskopData.jobOrders?.forEach((data: any) => {
      const jobOrder = ({
        job_id: data.jobId,
        batch_no: data.batchNo,
        batch_correction_no: data.batchCorrectionNo,
        dispenser_id: data.dispenserId,
        machine_id: data.machineId,
        tank_no: data.tankNo,
        program_no: data.programNo,
        recipe_type: data.recipeType,
        recipe_process_no: data.recipeProcessNo,
        recipe_step_no: data.recipeStepNo,
        step_no: data.stepNo,
        request_time: data.requestTime,
        completed_time: data.completedTime,
        status: data.status,
      })
      jobOrders.push(jobOrder)
    })

    teleskopData.materials?.forEach((data: any) => {
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
    teleskopData.materialReqs?.forEach((data: any) => {
      const materialReq = ({
        material_code: data.materialCode,
        req_no: data.jobId,
        recipe_amount: data.recipeAmount,
        real_amount: data.realAmount,
        main_step: data.mainStep,
        parallel_step: data.parallelStep,
        dispenser_id: data.dispenserId,
        status: data.status,
      })
      materialReqs.push(materialReq)
    })
    teleskopData.dustMaterials?.forEach((data: any) => {
      const dustMaterial = ({
        req_no: data.reqNo,
        material_code: data.materialCode,
        recipe_amount: data.recipeAmount,
        real_amount: data.realAmount,
        main_step: data.mainStep,
        parallel_step: data.parallelStep,
      })
      dustMaterials.push(dustMaterial)
    })
    teleskopData.dustMaterialReqs?.forEach((data: any) => {
      const dustMaterialReq = ({
        req_no: data.reqNo,
        batch_no: data.batchNo,
        queue_no: data.queueNo,
        correction_no: data.correctionNo,
        dispenser_id: data.dispenserId,
        machine_id: data.machineId,
        recipe_type: data.recipeType,
        recipe_index: data.recipeIndex,
        request_time: data.requestTime,
        status: data.status,
      })
      dustMaterialReqs.push(dustMaterialReq)
    })
    teleskopData.batchPlans?.forEach((data: any) => {
      const batchPlan = ({
        plan_key: data.planKey,
        batch: data.batch,
        batch_correction_no: data.batchCorrectionNo,
        planned_machine: data.plannedMachine,
        planned_start_date: data.plannedStartDate,
      })
      batchPlans.push(batchPlan)
    })
    teleskopData.batchHeaders?.forEach((data: any) => {
      const batchHeader = ({
        plan_key: data.planKey,
        recipe_index: data.recipeIndex,
        recipe_no: data.recipeNo,
        recipe_type: data.recipeType,
      })
      batchHeaders.push(batchHeader)
    })
    teleskopData.batchRecipeSteps?.forEach((data: any) => {
      const batchRecipeStep = ({
        plan_key: data.planKey,
        batch_order: data.batchNo,
        main_step: data.mainStep,
        parallel_step: data.parallelStep,
        req_no_batch: data.ISN,
        process_order: data.processOrder,
        chem_code: data.chemCode,
        prog_proc_no: data.programProcessNo,
        amount: data.amount,
        unit: data.unit,
      })
      batchRecipeSteps.push(batchRecipeStep)
    })
    teleskopData.batchPlanParameters?.forEach((data: any) => {
      const batchPlanParameter = ({
        plan_key: data.planKey,
        param_id: data.paramId,
        param_name: data.parameter,
        param_type: data.type,
        value: data.value,
        unit: data.unit,
      })
      batchPlanParameters.push(batchPlanParameter)
    })
    teleskopData.dispenserMachineConnections?.forEach((data: any) => {
      const dispenserMachineConnection = ({
        dispenser_id: data.dispenserId,
        machine_id: data.machineId,
      })
      dispenserMachineConnections.push(dispenserMachineConnection)
    })
    teleskopData.dispenserMaterialConnections?.forEach((data: any) => {
      const dispenserMaterialConnection = ({
        dispenser_id: data.dispenserId,
        material_code: data.materialCode,
      })
      dispenserMaterialConnections.push(dispenserMaterialConnection)
    })
    const batchSize = 3000
    /*
    await dmsDB('JOB_ORDER').del()
    await dmsDB('BATCH_RECIPE_STEP').del()
    await dmsDB('DISPENSER').del()
    await dmsDB('MACHINE').del()
    await dmsDB('MATERIAL_REQUEST').del()
    await dmsDB('MATERIAL').del()
    await dmsDB('BATCH_PLAN').del()
    await dmsDB('BATCH_HEADER').del()
    await dmsDB('PROGRAM_HEADER').del()
    await dmsDB('DISPENSER_MACHINE_CONNECTION').del()
    await dmsDB('DISPENSER_MATERIAL_CONNECTION').del()
    */
    await batchInsert(dispensers, batchSize, 'DISPENSER')
    await batchInsert(batchRecipeSteps, batchSize, 'BATCH_RECIPE_STEP')
    await batchInsert(machines, batchSize, 'MACHINE')
    await batchInsert(jobOrders, batchSize, 'JOB_ORDER')
    await batchInsert(materials, batchSize, 'MATERIAL')
    await batchInsert(materialReqs, batchSize, 'MATERIAL_REQUEST')
    await batchInsert(dustMaterials, batchSize, 'DUST_MATERIAL')
    await batchInsert(dustMaterialReqs, batchSize, 'DUST_MATERIAL_REQUEST')
    await batchInsert(batchPlans, batchSize, 'BATCH_PLAN')
    await batchInsert(batchHeaders, batchSize, 'BATCH_HEADER')
    await batchInsert(batchPlanParameters, batchSize, 'BATCH_PLAN_PARAMETER')
    await batchInsert(programHeaders, batchSize, 'PROGRAM_HEADER')
    batchInsert(dispenserMachineConnections, batchSize, 'DISPENSER_MACHINE_CONNECTION')
    batchInsert(dispenserMaterialConnections, batchSize, 'DISPENSER_MATERIAL_CONNECTION')
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

      // batch.forEach(data => trx(`${tableName} as t`).insert(data),
      // .whereExists(dmsDB.select('*')
      // .from('MACHINE as m')
      // .whereRaw('t.machine_id = m.machine_id'))
      // )
    }
  })
}
