import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { id, machineId, commandNo } = await readBody(event)

    const res = await knex('BFCOMMANDTIMEOUTREASONMAP').where({
      REASONID: id,
      MACHINEID: machineId,
      COMMANDNO: commandNo,
    }).del()

    return res

})
