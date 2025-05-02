import { knex } from '~/server/connectionPool'
import type { IOOption } from '~/types'

export default defineAuthEventHandler(async () => {
  const MTTempIOOptions: IOOption[] = await knex('BFMACHAIN')
    .select({
      machineId: 'MACHINEID',
      ioId: 'ID',
      ioName: 'NAME',
    })

  return MTTempIOOptions
})
