import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const tankDefinition = await readBody(event)
    const { machineId, tankDefinitionId, listName, commandNo, action } = tankDefinition
    console.log('machineId, tankDefinitionId, listName, commandNo, action = ', machineId, tankDefinitionId, listName, commandNo, action)

    if (action === 'add') {
      await addToList(machineId, tankDefinitionId, listName, commandNo)
    } else if (action === 'remove') {
      await removeFromList(machineId, tankDefinitionId, listName, commandNo)
    }
  } catch (e) {
    console.log('e = ', e)
    return e
  }
})

async function addToList(machineId, tankDefinitionId, listName, commandNo) {
  let fieldToUpdate
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

async function removeFromList(machineId, tankDefinitionId, listName, commandNo) {
  let fieldToUpdate
  if (listName === 'listOfTransferCommands')
    fieldToUpdate = 'LISTOFTRASNFERCOMMANDS'
  else fieldToUpdate = `${listName.toUpperCase()}`

  const tank = await knex('BFMACHINETANKS')
    .select(fieldToUpdate)
    .where('TANKNO', tankDefinitionId)
    .andWhere('MACHINEID', machineId)
    .first()

  if (tank[fieldToUpdate]) {
    const commands = tank[fieldToUpdate].split(',').map(item => item.trim())
    const index = commands.indexOf(commandNo.toString())
    if (index !== -1) {
      commands.splice(index, 1)
      tank[fieldToUpdate] = commands.join(', ')
      return await knex('BFMACHINETANKS')
        .where('MACHINEID', machineId)
        .andWhere('TANKNO', tankDefinitionId)
        .update({ [fieldToUpdate]: tank[fieldToUpdate] })
    }
  }
  return false
}
