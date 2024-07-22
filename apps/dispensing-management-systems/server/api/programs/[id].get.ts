import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const res = await dmsDB('PROGRAM_HEADER').select({
    machineId: 'machine_id',
    programNo: 'program_no',
    programName: 'program_name',
  }).where('machine_id', id).orderBy('program_no')
  return res
})
