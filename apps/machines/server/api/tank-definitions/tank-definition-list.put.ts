import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, tankNo, listOfTransferCommands, listOfRequestCommands, listOfCirculationDosageCommands, listOfCirculationRequestCommands } = await readBody(event)

  await knex('BFMACHINETANKS')
    .where('MACHINEID', machineId)
    .andWhere('TANKNO', tankNo)
    .update({
      LISTOFTRASNFERCOMMANDS: listOfTransferCommands.join(','),
      LISTOFREQUESTCOMMANDS: listOfRequestCommands.join(','),
      LISTOFCIRCULATIONDOSAGECOMMANDS: listOfCirculationDosageCommands.join(','),
      LISTOFCIRCULATIONREQUESTCOMMANDS: listOfCirculationRequestCommands.join(','),
    })
})
