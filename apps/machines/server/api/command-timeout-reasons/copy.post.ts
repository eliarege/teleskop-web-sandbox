import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { sourceMachineId, targetMachineId } = await readBody(event)

  const filteredReasonMap = await knex('BFCOMMANDTIMEOUTREASONMAP')
    .where('MACHINEID', sourceMachineId)
    .whereIn('COMMANDNO', knex('BFMASTERCOMMANDS')
      .where('MACHINEID', targetMachineId)
      .select('COMMANDNO'))

  await knex('BFCOMMANDTIMEOUTREASONMAP')
    .where('MACHINEID', targetMachineId)
    .del()

  await knex('BFCOMMANDTIMEOUTREASONMAP')
    .insert(filteredReasonMap.map(r => ({
      REASONID: r.REASONID,
      MACHINEID: targetMachineId,
      COMMANDNO: r.COMMANDNO,
    })))

  return filteredReasonMap
})
