import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, commandNo } = getQuery(event)
  return await knex('BFCOMMANDPARAMETERS')
    .where({
      MACHINEID: machineId,
      COMMANDNO: commandNo,
    })
    .select({
      machineId: 'MACHINEID',
      commandNo: 'COMMANDNO',
      parameterIndex: 'PARAMETERINDEX',
      paramString: 'PARAMSTRING',
      commandDefinition: 'COMMANDDEFINITION',
      programEditing: 'PROGRAMEDITING',
      batchPlanning: 'BATCHPLANNING',
      batchStart: 'BATCHSTART',
      commandRun: 'COMMANDRUN',
      recipe: 'RECIPE',
      value: 'VALUE',
      parameterType: 'PARAMETERTYPE',
      selectionList: 'SELECTIONLIST',
      selectionValues: 'SELECTIONVALUES',
      unitCode: 'UNITCODE',
      paramLowLimit: 'PARAMLOWLIMIT',
      paramHighLimit: 'PARAMHIGHLIMIT',
      containsVariable: 'CONTAINSVARIABLE',
      temperature: 'TEMPERATURE',
      useDefault: 'USEDEFAULT',
      isCommandVariable: 'ISCOMMANDVARIABLE',
      tbbFormul: 'TBBFORMUL',
      useFormula: 'USEFORMULA',
    })
})
