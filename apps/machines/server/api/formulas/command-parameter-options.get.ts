import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, commandNo } = getQuery(event)

  const res = await knex('BFCOMMANDPARAMETERS')
    .where({
      MACHINEID: machineId,
      COMMANDNO: commandNo,
      PARAMETERTYPE: 1,
      USEFORMULA: 1,
    })
    .select({
      paramString: 'PARAMSTRING',
      defaultValue: 'VALUE',
    })

  return res.map(row => ({
    ...row,
    defaultValue: row.defaultValue === 0 ? 1 : row.defaultValue,
  }))
})
