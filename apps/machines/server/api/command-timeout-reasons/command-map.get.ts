import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {

    return await knex('BFCOMMANDTIMEOUTREASONMAP').select({
      machineId: 'MACHINEID',
      reasonId: 'REASONID',
      commandNo: 'COMMANDNO',
    })

})
