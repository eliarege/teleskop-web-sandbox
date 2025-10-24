import { filtersToKnex } from '@teleskop/utils'
import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { filters, machineId } = await readBody(event)
  const selectParams = ({
    machineId: 'machine_id',
    programNo: 'program_no',
    programName: 'program_name',
    programType: 'program_type',
    chemRequests: 'chem_requests',
    dyeRequests: 'dye_requests',
    saltRequests: 'salt_requests',
  })
  const programs = dmsDB('PROGRAM_HEADER')
    .select(selectParams)
    .where('machine_id', '=', machineId)
    .orderBy(['program_no']).limit(1500)
  if (filters)
    filtersToKnex(filters, selectParams, programs)
  return await programs
})
