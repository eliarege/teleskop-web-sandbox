import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, tankNo, name, highLimit, machineConstantHighLimit, listOfTransferCommands, listOfRequestCommands, listOfCirculationDosageCommands, listOfCirculationRequestCommands } = await readBody(event)

  const record = await knex('BFMACHINETANKS')
    .where('MACHINEID', machineId)
    .andWhere('TANKNO', tankNo)

  if (record.length === 0) {
    await knex('BFMACHINETANKS').insert({
      MACHINEID: machineId,
      TANKNO: tankNo,
      NAME: name,
      HIGHLIMIT: highLimit,
      MACHINECONSTANTHIGHLIMIT: machineConstantHighLimit,
      LISTOFTRASNFERCOMMANDS: listOfTransferCommands.join(','),
      LISTOFREQUESTCOMMANDS: listOfRequestCommands.join(','),
      LISTOFCIRCULATIONDOSAGECOMMANDS: listOfCirculationDosageCommands.join(','),
      LISTOFCIRCULATIONREQUESTCOMMANDS: listOfCirculationRequestCommands.join(','),
    })
  } else
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
