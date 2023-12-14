import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)
    const machines = await knex('BFMACHINETANKS')
      .leftJoin('BFMACHINES', 'BFMACHINES.MACHINEID', 'BFMACHINETANKS.MACHINEID')
      .where('BFMACHINETANKS.MACHINEID', machineId)
      .select({
        machineId: 'BFMACHINETANKS.MACHINEID',
        machineName: 'MACHINECODE',
        tankNo: 'TANKNO',
        name: 'NAME',
        highLimit: 'HIGHLIMIT',
        machineConstantHighLimit: 'MACHINECONSTANTHIGHLIMIT',
        listOfTransferCommands: 'LISTOFTRASNFERCOMMANDS',
        listOfCirculationDoSageCommand: 'LISTOFCIRCULATIONDOSAGECOMMANDS',
        listOfCirculationRequestCommands: 'LISTOFCIRCULATIONREQUESTCOMMANDS',
        listOfRequestCommands: 'LISTOFREQUESTCOMMANDS',
      })

    return machines.map((d) => {
      return {
        ...d,
        listOfTransferCommands: d.listOfTransferCommands ? d.listOfTransferCommands.split(',').map(Number) : [],
        listOfCirculationDoSageCommand: d.listOfCirculationDoSageCommand ? d.listOfCirculationDoSageCommand.split(',').map(Number) : [],
        listOfCirculationRequestCommands: d.listOfCirculationRequestCommands ? d.listOfCirculationRequestCommands.split(',').map(Number) : [],
        listOfRequestCommands: d.listOfRequestCommands ? d.listOfRequestCommands.split(',').map(Number) : [],
      }
    })
  } catch (e) {
    return e
  }
})
