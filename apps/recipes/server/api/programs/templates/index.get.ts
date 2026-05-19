import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  if (!machineId) {
    throw createError({
      statusCode: 400,
      message: 'machineId is required',
    })
  }
  // check if number
  if (isNaN(Number(machineId))) {
    throw createError({
      statusCode: 400,
      message: 'machineId must be a number',
    })
  }
  const res = await dmsDB('PROGRAM_HEADER as p').select({
    programNo: 'p.program_no',
    programName: 'p.program_name',
    machineId: 'p.machine_id',
    chemRequests: 'p.chem_requests',
    dyeRequests: 'p.dye_requests',
    saltRequests: 'p.salt_requests',
  })
    .where('p.machine_id', Number(machineId))
    .leftJoin('PROGRAM_TEMPLATE as t', function () {
      this.on('p.program_no', 't.program_no')
        .andOn('p.machine_id', 't.machine_id')
    })
    .whereNotNull('p.program_name')
    .distinct('p.program_no')
    .orderBy('p.program_no')
  return res
})
