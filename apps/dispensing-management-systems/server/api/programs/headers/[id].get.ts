import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const res = await dmsDB('PROGRAM_HEADER').select({
    machineId: 'machine_id',
    programNo: 'program_no',
    programName: 'program_name',
    chemRequests: 'chem_requests',
    dyeRequests: 'dye_requests',
    saltRequests: 'salt_requests'
  }).where('machine_id', id).orderBy('program_no')
  return res
})
