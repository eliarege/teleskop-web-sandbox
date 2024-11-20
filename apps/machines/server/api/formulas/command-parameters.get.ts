import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, commandNo } = getQuery(event)

  const result = await knex('BFCOMMANDPARAMETERS')
    .where({
      MACHINEID: machineId,
      COMMANDNO: commandNo,
      PARAMETERTYPE: 1,
      USEFORMULA: 1,
    })
    .select({
      parameterIndex: 'PARAMETERINDEX',
      paramString: 'PARAMSTRING',
    })

  return result
})
