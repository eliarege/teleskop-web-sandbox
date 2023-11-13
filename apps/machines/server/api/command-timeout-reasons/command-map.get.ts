import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    return await knex('BFCOMMANDTIMEOUTREASONMAP').select({
      machineId: 'MACHINEID',
      reasonId: 'REASONID',
      commandNo: 'COMMANDNO',
    })
  } catch (e) {
    return e
  }
})
