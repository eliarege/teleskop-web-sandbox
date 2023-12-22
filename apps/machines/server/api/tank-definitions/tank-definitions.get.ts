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
        listOfCirculationDoSageCommands: 'LISTOFCIRCULATIONDOSAGECOMMANDS',
        listOfCirculationRequestCommands: 'LISTOFCIRCULATIONREQUESTCOMMANDS',
        listOfRequestCommands: 'LISTOFREQUESTCOMMANDS',
      })

    return machines.map((d) => {
      return {
        ...d,
        listOfTransferCommands: d.listOfTransferCommands ? d.listOfTransferCommands.split(',').map(Number) : [],
        listOfCirculationDoSageCommands: d.listOfCirculationDoSageCommands ? d.listOfCirculationDoSageCommands.split(',').map(Number) : [],
        listOfCirculationRequestCommands: d.listOfCirculationRequestCommands ? d.listOfCirculationRequestCommands.split(',').map(Number) : [],
        listOfRequestCommands: d.listOfRequestCommands ? d.listOfRequestCommands.split(',').map(Number) : [],
      }
    })
  } catch (e) {
    return e
  }
})
