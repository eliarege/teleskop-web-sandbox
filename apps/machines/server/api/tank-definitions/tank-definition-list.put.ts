import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const tankDefinition = await readBody(event)
    const { machineId, tankDefinitionId, listName, commandNo } = tankDefinition
    console.log('machineId, tankDefinitionId, listName, commandNo = ', machineId, tankDefinitionId, listName, commandNo)

    const res = await updateList(machineId, tankDefinitionId, listName, commandNo)

    return res
  } catch (e) {
    console.log('e = ', e)
    return e
  }
})

async function updateList(machineId, tankDefinitionId, listName, commandNo) {
  let fieldToUpdate
  // typo in DB column name
  if (listName === 'listOfTransferCommands')
    fieldToUpdate = 'LISTOFTRASNFERCOMMANDS'
  else fieldToUpdate = `${listName.toUpperCase()}`

  const tank = await knex('BFMACHINETANKS')
    .select(fieldToUpdate)
    .where('TANKNO', tankDefinitionId)
    .andWhere('MACHINEID', machineId)
    .first()

  if (!tank[fieldToUpdate]) {
    tank[fieldToUpdate] = `${commandNo}`
  } else {
    tank[fieldToUpdate] = `${tank[fieldToUpdate]}, ${commandNo}`
  }

  return await knex('BFMACHINETANKS')
    .where('MACHINEID', machineId)
    .andWhere('TANKNO', tankDefinitionId)
    .update({ [fieldToUpdate]: tank[fieldToUpdate] })
}
