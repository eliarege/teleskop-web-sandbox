import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const tankDefinition = await readBody(event)
    const { machineId, tankDefinitionId, listName, commandNo } = tankDefinition
    console.log('machineId, tankDefinitionId, listName, commandNo = ', machineId, tankDefinitionId, listName, commandNo)

    let updateObj = {}
    if (listName === 'listOfTransferCommands') {
      const commands = await knex('BFMACHINETANKS')
        .select('LISTOFTRASNFERCOMMANDS')
        .where('TANKNO', tankDefinitionId)
        .andWhere('MACHINEID', machineId)
        .first()

      if (!commands.LISTOFTRASNFERCOMMANDS) {
        commands.LISTOFTRASNFERCOMMANDS = `${commandNo}`
      } else {
        commands.LISTOFTRASNFERCOMMANDS = `${commands.LISTOFTRASNFERCOMMANDS}, ${commandNo}`
      }
      console.log('commands = ', commands)

      updateObj = commands
    } else if (listName === 'listOfCirculationDoSageCommand') {
      const commands = await knex('BFMACHINETANKS').select('LISTOFCIRCULATIONDOSAGECOMMANDS')
      commands.concat(` ${commandNo}`)
      updateObj.LISTOFCIRCULATIONDOSAGECOMMANDS = commands
    } else if (listName === 'listOfCirculationRequestCommands') {
      const commands = await knex('BFMACHINETANKS').select('LISTOFCIRCULATIONREQUESTCOMMANDS')
      commands.concat(` ${commandNo}`)
      updateObj.LISTOFCIRCULATIONREQUESTCOMMANDS = commands
    } else if (listName === 'listOfRequestCommands') {
      const commands = await knex('BFMACHINETANKS').select('LISTOFREQUESTCOMMANDS')
      commands.concat(` ${commandNo}`)
      updateObj.LISTOFREQUESTCOMMANDS = commands
    }

    console.log('updateObj = ', updateObj)
    return await knex('BFMACHINETANKS')
      .where('MACHINEID', machineId)
      .andWhere('TANKNO', tankDefinitionId)
      .update(updateObj)
  } catch (e) {
    console.log('e = ', e)
    return e
  }
})
