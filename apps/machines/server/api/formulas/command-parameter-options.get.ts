import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  const res = await knex('BFCOMMANDPARAMETERS')
    .where('MACHINEID', machineId)
    .select({
      paramString: 'PARAMSTRING',
      defaultValue: 'VALUE',
    })

  return res.map(row => ({
    ...row,
    defaultValue: row.defaultValue === 0 ? 1 : row.defaultValue,
  }))
})
