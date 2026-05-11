import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const res = await dmsDB('PROGRAM_HEADER as p').select({
    programNo: 'p.program_no',
    programName: 'p.program_name',
    machineId: 'p.machine_id',
    chemRequests: 'p.chem_requests',
    dyeRequests: 'p.dye_requests',
    saltRequests: 'p.salt_requests',
  })
    .where('p.machine_id', machineId)
    .leftJoin('PROGRAM_TEMPLATE as t', function () {
      this.on('p.program_no', 't.program_no')
        .andOn('p.machine_id', 't.machine_id')
    })
    .whereNotNull('p.program_name')
    .distinct('p.program_no')
    .orderBy('p.program_no')
  return res
})
