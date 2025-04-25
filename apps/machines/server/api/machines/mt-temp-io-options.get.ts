import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async () => {
  const MTTempIOOptions: { machineId: number, id: number, name: string }[] = await knex('BFMACHDOUT')
    .select({
      machineId: 'MACHINEID',
      id: 'ID',
      name: 'NAME',
    })

  return MTTempIOOptions
})
