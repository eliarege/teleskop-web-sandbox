import { filtersToKnex } from '@teleskop/utils'
import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { filters } = await readBody(event)
  const selectParams = ({
    jobId: 'j.job_id',
    batchNo: 'j.batch_no',
    batchCorrectionNo: 'j.batch_correction_no',
    machineName: 'm.machine_name',
    machineId: 'm.machine_id',
    recipeName: dmsDB.raw(`(
      SELECT rm.recipe_name
      FROM "RECIPE_MASTER" rm
      WHERE rm.recipe_id = b.recipe_id AND rm.machine_id = j.machine_id
      LIMIT 1
    )`),
    programNos: dmsDB.raw(`(
      SELECT array_agg(DISTINCT j2.program_no)
      FROM "JOB_ORDER" j2
      WHERE j2.batch_no = j.batch_no
    )`),
    programNames: dmsDB.raw(`(
      SELECT array_agg(DISTINCT ph.program_name)
      FROM "JOB_ORDER" j2
      JOIN "PROGRAM_HEADER" ph ON ph.program_no = j2.program_no AND ph.machine_id = j2.machine_id
      WHERE j2.batch_no = j.batch_no
    )`),
    requestTime: 'j.request_time',
    colorName: 'b.color_name',
    customerName: 'b.customer_name',
    workOrder: 'b.order_no',
    yarn: 'b.yarn',
    type: 'j.type',
    ASNo: 'b.as_no',
    fabricType: 'b.fabric_type',
    recipeType: 'j.recipe_type',
    priority: 'priority',
    status: 'j.status',
  })

  let jobOrders = dmsDB('JOB_ORDER as j')
    .select(selectParams)
    .leftJoin('MACHINE as m', 'j.machine_id', 'm.machine_id')
    .leftJoin('PROGRAM_HEADER as p', (builder) => {
      builder.on('j.program_no', 'p.program_no').andOn('j.machine_id', 'p.machine_id')
    })
    .leftJoin('BATCH_PLAN as b', (builder) => {
      builder
        .on('b.batch', '=', 'j.batch_no')
        .andOn('b.batch_correction_no', '=', 'j.batch_correction_no')
    })
    .where('j.type', '=', '1')
    .whereIn('j.job_id', function () {
      this.select(dmsDB.raw('MAX(job_id)'))
        .from('JOB_ORDER')
        .groupBy('batch_no')
    })
    .orderBy('j.job_id', 'desc')

  const { dispenserId } = getQuery(event)
  if (dispenserId) {
    jobOrders = jobOrders.where('j.dispenser_id', '=', dispenserId)
  }

  jobOrders = jobOrders.limit(1000)
  if (filters)
    filtersToKnex(filters, selectParams, jobOrders)
  const rows = await jobOrders
  return rows
})
