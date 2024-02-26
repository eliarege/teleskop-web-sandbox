import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { sourceMachineId, targetMachineId } = await readBody(event)

  for (const table of ['BFMACHAIN', 'BFMACHAOUT']) {
    const records = await knex(table)
      .where('MACHINEID', sourceMachineId)

    await knex(table)
      .where('MACHINEID', targetMachineId)
      .del()

    await knex(table)
      .insert(records.map(r => ({
        ...r,
        MACHINEID: targetMachineId,
      })))
  }
})
