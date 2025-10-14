import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { dispenserid } = getRouterParams(event)
  const { added, deleted } = await readBody(event)
  if (deleted.length > 0) {
    await dmsDB('DISPENSER_MACHINE_CONNECTION')
      .whereIn('machine_id', deleted)
      .andWhere('dispenser_id', dispenserid)
      .del()
  }
  if (added.length > 0) {
    const insertRows = added.map((machineId: any) => ({
      machine_id: machineId,
      dispenser_id: dispenserid,
    }))
    await dmsDB('DISPENSER_MACHINE_CONNECTION').insert(insertRows)
      .onConflict(['dispenser_id', 'machine_id']).ignore()
  }
  return null
})
