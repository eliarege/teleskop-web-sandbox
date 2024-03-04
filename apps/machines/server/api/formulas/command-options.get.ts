import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  return await knex('BFMASTERCOMMANDS')
    .where({
      MACHINEID: machineId,
      ACTIVATED: 1,
    })
    .whereIn('COMMANDNO', (q) => {
      q
        .select('COMMANDNO')
        .from('BFCOMMANDPARAMETERS')
        .where({
          MACHINEID: machineId,
          PARAMETERTYPE: 1,
          USEFORMULA: 1,
        })
    })
    .select({
      commandNo: 'COMMANDNO',
      commandName: 'NAME',
    },
    )
    .orderBy('COMMANDNO')
})
