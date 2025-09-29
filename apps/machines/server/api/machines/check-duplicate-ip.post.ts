import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { ip, currentMachineId } = await readBody(event)

  let query = knex('BFMACHINES')
    .where('IP', ip)
    .where('USEINTELESKOP', true)
    .whereNot('GRUPNO', -1)

  if (currentMachineId) {
    query = query.whereNot('MACHINEID', currentMachineId)
  }

  const existingMachine = await query.first()

  return {
    isDuplicate: !!existingMachine,
  }
})
