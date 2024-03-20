import { getTeleskopDB } from '~/server/connectionPool'

const machineParams = {
  machineName: 'MACHINENAME',
  machineId: 'MACHINEID',
  controllerType: 'CONTROLLERTYPE',
}

export default defineEventHandler(async () => {
  try {
    const teleskopDB = await getTeleskopDB()

    const machines = await teleskopDB('dbo.DYTFMACHINES')
      .select(machineParams)
    $fetch('/api/teleskop/sync/machines', { method: 'POST', body: { machines } })
  } catch (e) {
    console.log(e)
    return e
  }
})
