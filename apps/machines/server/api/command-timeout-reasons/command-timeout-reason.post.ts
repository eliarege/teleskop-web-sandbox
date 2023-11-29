import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { id, machineId, commandNo } = await readBody(event)

    const res = await knex('BFCOMMANDTIMEOUTREASONMAP').insert({
      REASONID: id,
      MACHINEID: machineId,
      COMMANDNO: commandNo,
    })

    return res
  } catch (e) {
    return e
  }
})
