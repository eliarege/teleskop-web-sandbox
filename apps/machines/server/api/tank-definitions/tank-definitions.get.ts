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
      .orderBy('BFMACHINETANKS.MACHINEID')
    return machines
  } catch (e) {
    return e
  }
})
