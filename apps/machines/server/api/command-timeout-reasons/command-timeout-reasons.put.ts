import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { changedReasons } = await readBody(event)
  for (const reason of changedReasons) {
    const { id, machineId, commandNo, checked } = reason

    checked
      ? await knex('BFCOMMANDTIMEOUTREASONMAP').insert({
        REASONID: id,
        MACHINEID: machineId,
        COMMANDNO: commandNo,
      })
      : await knex('BFCOMMANDTIMEOUTREASONMAP').where({
        REASONID: id,
        MACHINEID: machineId,
        COMMANDNO: commandNo,
      }).del()
  }
})
