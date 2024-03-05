import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const teleskopData = await readBody(event)
    const machines: any[] = []

    teleskopData.machines?.forEach((data: any) => {
      const machine = {
        machine_id: data.machineId,
        machine_name: data.machineName,
        controller_type: data.controllerType,
      }
      machines.push(machine)
    })
    const batchSize = 3000
    await batchInsert(machines, batchSize, 'MACHINE')
  } catch (e) {
    console.error(e)
    return e
  }
})
async function batchInsert(data: any[], batchSize: number, tableName: string) {
  const totalRows = data.length
  const numBatches = Math.ceil(totalRows / batchSize)
  await dmsDB.transaction(async (trx) => {
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize
      const end = Math.min((i + 1) * batchSize, totalRows)
      const batch = data.slice(start, end)

      // Generate the SQL query for batch insertion with ON CONFLICT DO UPDATE
      const insertQuery = trx(tableName)
        .insert(batch)
        .toQuery()

      const conflictUpdateFields = Object.keys(batch[0])
        .map(key => `"${key}" = EXCLUDED."${key}"`) // Map each field to "field = EXCLUDED.field"
        .join(', ')

      const onConflictUpdateQuery = `${insertQuery} ON CONFLICT (machine_id) DO UPDATE SET ${conflictUpdateFields}`

      // Execute the query
      await trx.raw(onConflictUpdateQuery)
    }
  })
}
