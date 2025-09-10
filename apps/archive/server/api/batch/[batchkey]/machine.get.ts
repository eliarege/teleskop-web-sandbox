import { db } from '~/server/database'
import type { Machine, MachineCommand, MachineCommandIO } from '~/types/archive'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const batch = await db('BADATA').first({
    machineId: 'MACHINEID',
    startTime: 'STARTTIME',
  }).where('BATCHKEY', batchKey) as {
    machineId: number
    startTime: Date
  }

  if (!batch) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'BATCH_NOT_FOUND',
    })
  }

  const machine = await db
    .from('BFMACHINES as M')
    .where('MACHINEID', batch.machineId)
    .first({
      id: 'MACHINEID',
      name: 'MACHINECODE',
      capacity: 'MACHINECAPACITY',
      theoreticalCharge: 'THEORICALCHARGE',
      model: 'TBBMODEL',
      constants: db.raw(/* sql */`(
        ISNULL((
          SELECT PARAMSTRING name, currentValue value
          FROM BFMACHPARAMETERS P
          WHERE M.MACHINEID = P.MACHINEID
          FOR JSON AUTO, INCLUDE_NULL_VALUES
        ), '[]')
      )`),
      batchParameters: db.raw(/* sql */`(
        ISNULL((
          SELECT
            BATCHPARAMETERID id
          , PARAMSTRING name
          , NULLIF(DEFAULTVALUE, -9999) defaultValue
          FROM BFMACHBATCHPARAMETERS P
          WHERE M.MACHINEID = P.MACHINEID
          FOR JSON AUTO, INCLUDE_NULL_VALUES
        ), '[]')
      )`),
      commandFormulas: db.raw(/* sql */`(
        ISNULL((
          SELECT formulaId id, formula
          FROM BFCOMMANDFORMULAS F
          WHERE M.MACHINEID = F.machineId
          FOR JSON AUTO, INCLUDE_NULL_VALUES
        ), '[]')
      )`),
    }) as Machine

  if (!machine) {
    throw new Error(`Machine ${batch.machineId} not found.`)
  }

  machine.constants = JSON.parse(machine.constants as unknown as string)
  machine.batchParameters = JSON.parse(machine.batchParameters as unknown as string)
  machine.commandFormulas = JSON.parse(machine.commandFormulas as unknown as string)

  machine.commands = await db
    .from('BFMASTERCOMMANDS')
    .select({
      commandNo: 'COMMANDNO',
      name: 'NAME',
      commandType: 'COMMANDTYPE',
      x: 'X',
      y: 'Y',
      a: 'A',
      maxA: 'MAXA',
      b: 'B',
      icon: 'ICON',
      isTemperature: 'ISTEMPERATURE',
      isUnload: 'ISUNLOAD',
    })
    .where('MACHINEID', batch.machineId)
    .orderBy('COMMANDNO') as MachineCommand[]

  const parameters = await db
    .from('BFCOMMANDPARAMETERS')
    .select({
      commandNo: 'COMMANDNO',
      index: 'PARAMETERINDEX',
      name: 'PARAMSTRING',
      type: db.raw(/* sql */`
        CASE
          WHEN TBBFORMUL = 1 THEN 'MACHINE_FORMULA'
          WHEN USEFORMULA = 1 THEN 'SELECTABLE_FORMULA'
          WHEN PARAMETERTYPE = 0 THEN 'NUMBER'
          WHEN PARAMETERTYPE = 1 THEN 'SELECT'
        END`,
      ),
      value: 'VALUE',
      containsVariable: 'CONTAINSVARIABLE',
      useDefault: 'USEDEFAULT',
      useFormula: 'USEFORMULA',
      selectionLabels: db.raw(`NULLIF(SELECTIONLIST, '')`),
      selectionValues: db.raw(`NULLIF(SELECTIONVALUES, '')`),
    })
    .where('MACHINEID', batch.machineId)
    .orderBy(['COMMANDNO', 'PARAMETERINDEX'])

  const ioList = await db
    .from('BFCOMMANDINPUTOUTPUTS')
    .select({
      commandNo: 'COMMANDNO',
      ioIndex: 'IOINDEX',
      type: db.raw('IOTYPE + 1'),
      physicalId: 'IOID',
      selectable: db.raw(/* sql */`CAST(CASE IOTYPE WHEN 5 THEN 1 ELSE 0 END as bit)`),
      name: 'NAME',
    })
    .where('MACHINEID', batch.machineId)
    .andWhere('IOID', '>=', 0)
    .orderBy(['COMMANDNO', 'IOINDEX'])

  const ioListSelections = await db
    .from('BFCOMMANDSELECTIONLIST')
    .select({
      commandNo: 'COMMANDNO',
      ioIndex: 'IOINDEX',
      index: 'SELECTINDEX',
      type: db.raw('IOTYPE + 1'),
      physicalId: 'IOID',
      name: 'NAME',
      defaultValue: 'ISDEFAULT',
    })
    .where('MACHINEID', batch.machineId)
    .andWhere('IOID', '>=', 0)
    .orderBy(['COMMANDNO', 'IOINDEX', 'SELECTINDEX'])

  let parCursor = 0
  let iosCursor = 0
  let selCursor = 0

  for (let i = 0; i < machine.commands.length; i++) {
    const command = machine.commands[i]
    command.parameters = []
    command.ioList = []
    for (; parCursor < parameters.length; parCursor++) {
      const rawParameter = parameters[parCursor]
      if (rawParameter.commandNo !== command.commandNo) {
        break
      }
      const selectionLabels = rawParameter.selectionLabels?.trim().slice(1, -1).split('" "') || [] as string[]
      const selectionValues = rawParameter.selectionValues?.trim().slice(1, -1).split('" "').map(Number) || [] as number[]
      const selectionLength = Math.min(selectionLabels.length, selectionValues.length)
      const selections = Array.from({ length: selectionLength }, (_, i) => {
        return {
          name: selectionLabels[i],
          value: selectionValues[i],
        }
      })

      command.parameters.push({
        index: rawParameter.index,
        name: rawParameter.name,
        type: rawParameter.type,
        value: rawParameter.value,
        containsVariable: rawParameter.containsVariable,
        useDefault: rawParameter.useDefault,
        useFormula: rawParameter.useFormula,
        selections,
      })
    }
    for (; iosCursor < ioList.length; iosCursor++) {
      const rawIo = ioList[iosCursor]
      if (rawIo.commandNo !== command.commandNo) {
        break
      }
      const currentIo: MachineCommandIO = {
        index: rawIo.ioIndex,
        name: rawIo.name,
        type: rawIo.type,
        physicalId: rawIo.physicalId,
        selectable: rawIo.selectable,
        selections: [],
      }
      command.ioList.push(currentIo)
      for (; selCursor < ioListSelections.length; selCursor++) {
        const rawIoSelection = ioListSelections[selCursor]
        if (rawIoSelection.ioIndex !== rawIo.ioIndex || rawIoSelection.commandNo !== rawIo.commandNo) {
          break
        }
        if (currentIo.selectable) {
          currentIo.selections.push({
            index: rawIoSelection.index,
            name: rawIoSelection.name,
            type: rawIoSelection.type,
            physicalId: rawIoSelection.physicalId,
            defaultValue: rawIoSelection.defaultValue,
          })
        }
      }
    }
  }

  return machine
})
