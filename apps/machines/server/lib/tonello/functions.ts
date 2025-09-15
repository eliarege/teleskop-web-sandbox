import type { Knex } from 'knex'
import { insertBatch, isDef } from '@teleskop/utils'
import { maxBy, minBy } from 'lodash-es'
import type { BFCOMMANDPARAMETERS, BFMASTERCOMMANDS, TonelloFunction } from '@teleskop/core'

import { CommandParameterType } from '@teleskop/core'
import type { UpdateContext } from '../types'
import {
  INVALID_PARAMETER_TYPE_ERROR,
  MISSING_LOCALE_ERROR,
} from './errors'
import { DEFAULT_LOCALE, extractLocalizedMessage, parseLocalizedString } from './locale'

export async function updateTonelloFunctions(
  trx: Knex.Transaction,
  machineId: number,
  functions: TonelloFunction[],
  ctx: UpdateContext,
): Promise<void> {
  const commands: BFMASTERCOMMANDS[] = []
  const parameters: BFCOMMANDPARAMETERS[] = []

  for (const fn of functions) {
    const name = extractLocalizedMessage(fn.label, DEFAULT_LOCALE)
    if (!isDef(name)) {
      ctx.errors.push({
        code: MISSING_LOCALE_ERROR,
        details: {
          index: fn.index,
          type: 'function',
          label: fn.label,
        },
      })
      continue
    }
    commands.push({
      MACHINEID: machineId,
      COMMANDNO: fn.index,
      TBBFUNTIONNAME: `f+${fn.index}`,
      NAME: name,
      ACTIVATED: true,
      ISRUNMANUAL: false,
      ICON: fn.img,
      COMMANDTYPE: 0,
      MOVEPARALLEL: 0,
      ISDELETED: false,
      ISCHANGED: true,
      GROUPID: 0,
      FUNCTIONID: 0,
    })
    ctx.messages.push(parseLocalizedString(fn.label))

    for (const [index, param] of fn.params.entries()) {
      if (param.type === 'additive') {
        continue // Skip additive parameters for now
      }

      const name = param.label && extractLocalizedMessage(param.label, DEFAULT_LOCALE) || ''
      const paramRow: BFCOMMANDPARAMETERS = {
        MACHINEID: machineId,
        COMMANDNO: fn.index,
        PARAMSTRING: name,
        COMMANDDEFINITION: false,
        PROGRAMEDITING: true,
        BATCHPLANNING: false,
        BATCHSTART: false,
        COMMANDRUN: false,
        RECIPE: false,
        VALUE: param.default?.toString() ?? null,
        PARAMHIGHLIMIT: 0,
        PARAMLOWLIMIT: 0,
        PARAMETERTYPE: 0,
        TEMPERATURE: 0,
        CONTAINSVARIABLE: false,
        ISCOMMANDVARIABLE: false,
        TBBFORMUL: false,
        USEDEFAULT: false,
        PARAMETERINDEX: index,
        PARAMETERGROUP: param.row,
        VALUEINDEX: param.index,
      }
      if (param.type === 'list') {
        paramRow.PARAMETERTYPE = CommandParameterType.SELECT
        paramRow.SELECTIONLIST = param.options
          .map(o => `"${extractLocalizedMessage(o.label, DEFAULT_LOCALE)}"`)
          .join(' ')
        paramRow.SELECTIONVALUES = param.options
          .map(o => `"${o.value}"`)
          .join(' ')
        paramRow.PARAMHIGHLIMIT = maxBy(param.options, 'value')!.value
        paramRow.PARAMLOWLIMIT = minBy(param.options, 'value')!.value
        ctx.messages.push(...param.options.map(o => parseLocalizedString(o.label)))
      } else if (param.type === 'bit') {
        paramRow.PARAMETERTYPE = CommandParameterType.CHECKBOX
        paramRow.PARAMHIGHLIMIT = 1
        paramRow.PARAMLOWLIMIT = 0
      } else if (param.type === 'value') {
        paramRow.PARAMETERTYPE = CommandParameterType.NUMBER
        paramRow.PARAMHIGHLIMIT = param.max
        paramRow.PARAMLOWLIMIT = param.min
      } else {
        ctx.errors.push({
          code: INVALID_PARAMETER_TYPE_ERROR,
          details: {
            index,
            fnIndex: fn.index,
            category: 'function-parameter',
            parameter: param,
          },
        })
        continue
      }
      parameters.push(paramRow)
      ctx.messages.push(parseLocalizedString(param.label))
    }
  }

  if (ctx.errors.length > 0) {
    return
  }

  await trx('BFCOMMANDPARAMETERS').delete().where({ MACHINEID: machineId })
  await trx('BFMASTERCOMMANDS').delete().where({ MACHINEID: machineId })
  await insertBatch(trx, 'BFMASTERCOMMANDS', commands)
  await insertBatch(trx, 'BFCOMMANDPARAMETERS', parameters)
}
