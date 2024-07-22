import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { progNo, machineId } = getQuery(event)

  const res = await dmsDB('COMMAND_STEP as s').select({
    machineId: 's.machine_id',
    programNo: 's.program_no',
    commandNo: 's.command_no',
    commandType: 't.command_type',
    commandName: 'm.command_name',
  })
    .leftJoin('MASTER_COMMAND as m', (builder) => {
      builder.on('m.machine_id', 's.machine_id')
        .andOn('m.command_no', 's.command_no')
    })
    .leftJoin('COMMAND_TYPE as t', (builder) => {
      builder.on('t.machine_id', 's.machine_id')
      .andOn('t.command_no', 's.command_no')
    })
    .where('s.program_no', progNo).andWhere('s.machine_id', machineId)
    .distinct('s.command_no')
  return res
},
)
