import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, programNo } = getQuery(event)
  const res = await dmsDB('COMMAND_STEP').select({
    machineId: 'machine_id',
    programNo: 'program_no',
    mainStep: 'main_step',
    parallelStep: 'parallel_step',
    commandNo: 'command_no',
  }).where('machine_id', machineId).andWhere('program_no', programNo).orderBy(['main_step', 'parallel_step']).distinct('*')
  return res
})
