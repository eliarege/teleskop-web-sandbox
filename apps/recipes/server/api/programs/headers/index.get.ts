import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const res = await dmsDB('PROGRAM_HEADER').select({
    machineId: 'machine_id',
    programNo: 'program_no',
    programName: 'program_name',
    programType: 'program_type',
    chemRequests: 'chem_requests',
    dyeRequests: 'dye_requests',
    saltRequests: 'salt_requests'
  }).orderBy(['machine_id','program_no']).limit(1000)
  return res
})
