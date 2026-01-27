import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const res = await dmsDB('PROGRAM_TEMPLATE as t').select({
    programNo: 't.program_no',
    programName: 'p.program_name',
    machineId: 't.machine_id',
    chemRequests: 'p.chem_requests',
    dyeRequests: 'p.dye_requests',
    saltRequests: 'p.salt_requests',
  })
    .where('t.machine_id', machineId)
    .leftJoin('PROGRAM_HEADER as p', function () {
      this.on('t.program_no', 'p.program_no')
        .andOn('t.machine_id', 'p.machine_id')
    })
    .distinct('t.program_no')
    .whereNotNull('p.program_name')
    .orderBy('t.program_no')
  return res
})
