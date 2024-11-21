import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { sourceMachineId, targetMachineId } = await readBody(event)

  await knex.transaction(async (trx) => {
    const filteredReasonMap = await trx('BFCOMMANDTIMEOUTREASONMAP')
      .where('MACHINEID', sourceMachineId)
      .whereIn('COMMANDNO', trx('BFMASTERCOMMANDS')
        .where('MACHINEID', targetMachineId)
        .select('COMMANDNO'))

    await trx('BFCOMMANDTIMEOUTREASONMAP')
      .where('MACHINEID', targetMachineId)
      .del()

    await trx('BFCOMMANDTIMEOUTREASONMAP')
      .insert(filteredReasonMap.map(r => ({
        REASONID: r.REASONID,
        MACHINEID: targetMachineId,
        COMMANDNO: r.COMMANDNO,
      })))

    return filteredReasonMap
  })
})
