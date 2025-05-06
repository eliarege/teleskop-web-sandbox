import { knex } from '~/server/connectionPool'
import type { IOOption } from '~/types'

export default defineAuthEventHandler(async () => {
  const steamValveDoOptions: IOOption[] = await knex('BFMACHDOUT')
    .select({
      machineId: 'MACHINEID',
      ioId: 'ID',
      ioName: 'NAME',
    })

  return steamValveDoOptions
})
