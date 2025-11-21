import type { ValueOf } from '@teleskop/utils'
import type { Knex } from 'knex'

export const ParameterType = {
  NUMBER: 'NUMBER',
  SELECT: 'SELECT',
  CHECKBOX: 'CHECKBOX',
  SELECT_ADDITIVE: 'SELECT_ADDITIVE',
  MACHINE_FORMULA: 'MACHINE_FORMULA',
  SELECTABLE_FORMULA: 'SELECTABLE_FORMULA',
} as const

export type ParameterTypeValue = ValueOf<typeof ParameterType>

export interface MachineCommand {
  machineId: number
  commandNo: number
  name: string
  parameters: CommandParameter[]
}

export interface CommandParameter {
  index: number
  name: string
  group: number | null
  editable: boolean
  type: ParameterTypeValue
  format: string
  value: string
  valueIndex: number | null
  minValue: number
  maxValue: number
  containsVariable: boolean
  useDefault: boolean
  useFormula: boolean
  selections: ParameterSelections[]
}

export interface ParameterSelections {
  name: string
  value: number
}

// TODO: this function currently does not fetch ioList for commands, this is enough for tonello batch creation though
export async function getMachineCommands(db: Knex, machineId: number): Promise<MachineCommand[]> {
  if (!db.isTransaction) {
    await db.transaction(async (trx) => {
      return getMachineCommands(trx, machineId)
    })
  }

  const commands = await db
    .from('BFMASTERCOMMANDS')
    .select({
      machineId: 'MACHINEID',
      commandNo: 'COMMANDNO',
      name: 'NAME',
    })
    .where('MACHINEID', machineId)
    .andWhere('ACTIVATED', 1)
    .orderBy('COMMANDNO') as MachineCommand[]

  const rawParameters = await db
    .from('BFCOMMANDPARAMETERS as P')
    .join('BFMASTERCOMMANDS as C', function () {
      this.on('P.MACHINEID', '=', 'C.MACHINEID')
        .andOn('P.COMMANDNO', '=', 'C.COMMANDNO')
    })
    .select({
      commandNo: 'P.COMMANDNO',
      index: 'P.PARAMETERINDEX',
      name: 'P.PARAMSTRING',
      group: 'P.PARAMETERGROUP',
      editable: 'P.PROGRAMEDITING',
      type: db.raw(`
          CASE
            WHEN TBBFORMUL = 1 THEN 'MACHINE_FORMULA'
            WHEN USEFORMULA = 1 THEN 'SELECTABLE_FORMULA'
            WHEN PARAMETERTYPE = 0 THEN 'NUMBER'
            WHEN PARAMETERTYPE = 1 THEN 'SELECT'
            WHEN PARAMETERTYPE = 2 THEN 'CHECKBOX'
            WHEN PARAMETERTYPE = 3 THEN 'SELECT_ADDITIVE'
          END
        `),
      format: db.raw(`
          CASE TEMPERATURE
            WHEN 0 THEN 'NONE'
            WHEN 1 THEN 'TEMPERATURE'
            ELSE 'DURATION'
          END
        `),
      value: 'P.VALUE',
      valueIndex: 'P.VALUEINDEX',
      minValue: 'P.PARAMLOWLIMIT',
      maxValue: 'P.PARAMHIGHLIMIT',
      containsVariable: 'P.CONTAINSVARIABLE',
      useDefault: 'P.USEDEFAULT',
      useFormula: 'P.USEFORMULA',
      selectionLabels: db.raw(`NULLIF(P.SELECTIONLIST, '')`),
      selectionValues: db.raw(`NULLIF(P.SELECTIONVALUES, '')`),
    })
    .where('P.MACHINEID', machineId)
    .andWhere('C.ACTIVATED', 1)
    .andWhere('P.PROGRAMEDITING', 1)
    .orderBy(['P.COMMANDNO', 'P.PARAMETERINDEX'])

  let parCursor = 0

  for (const command of commands) {
    command.parameters = []

    for (; parCursor < rawParameters.length; parCursor++) {
      const rawParameter = rawParameters[parCursor]
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
        group: rawParameter.group,
        editable: rawParameter.editable,
        type: rawParameter.type,
        format: rawParameter.format,
        value: rawParameter.value,
        valueIndex: rawParameter.valueIndex,
        minValue: rawParameter.minValue,
        maxValue: rawParameter.maxValue,
        containsVariable: rawParameter.containsVariable,
        useDefault: rawParameter.useDefault,
        useFormula: rawParameter.useFormula,
        selections,
      })
    }
  }

  return commands
}
