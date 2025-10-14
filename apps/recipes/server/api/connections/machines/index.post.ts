import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const { added, deleted } = await readBody(event)
  if (deleted.length > 0) {
    await dmsDB('DISPENSER_MACHINE_CONNECTION')
      .whereIn('dispenser_id', deleted)
      .andWhere('machine_id', machineId)
      .del()
  }
  if (added.length > 0) {
    const insertRows = added.map((dispenserId: any) => ({
      machine_id: machineId,
      dispenser_id: dispenserId,
    }))
    await dmsDB('DISPENSER_MACHINE_CONNECTION').insert(insertRows)
      .onConflict(['dispenser_id', 'machine_id']).ignore()
  }
  return null
})
