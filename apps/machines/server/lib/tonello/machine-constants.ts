import type { Knex } from 'knex'
import type { BFMACHPARAMETERS, TonelloMachineParameter } from '@teleskop/core'
import { insertBatch, isDef } from '@teleskop/utils'
import { MachineConstantType } from '@teleskop/core'
import type { UpdateContext } from '../types'
import { DEFAULT_LOCALE, extractLocalizedMessage, parseLocalizedString } from './locale'
import {
  INVALID_PARAMETER_TYPE_ERROR,
  MISSING_LOCALE_ERROR,
} from './errors'

export async function updateTonelloMachineParameteres(
  trx: Knex.Transaction,
  machineId: number,
  parameters: TonelloMachineParameter[],
  ctx: UpdateContext,
): Promise<void> {
  const rows: BFMACHPARAMETERS[] = []

  for (const [index, param] of parameters.entries()) {
    const name = extractLocalizedMessage(param.label, DEFAULT_LOCALE)
    if (!isDef(name)) {
      ctx.errors.push({
        code: MISSING_LOCALE_ERROR,
        details: {
          index,
          type: 'machine-parameter',
          label: param.label,
        },
      })
      continue
    }

    const paramRow: BFMACHPARAMETERS = {
      MACHINEID: machineId,
      MACHINEPARAMETERID: index,
      PARAMSTRING: name,
      PARAMLOWLIMIT: 0,
      PARAMHIGHLIMIT: 0,
      PARAMETERTYPE: 0,
      UNITCODE: 1,
      SELECTIONLIST: 'YOK',
      SELECTIONVALUES: 'YOK',
      ISDELETED: false,
    }
    if (param.type === 'bit') {
      paramRow.PARAMLOWLIMIT = 0
      paramRow.PARAMHIGHLIMIT = 1
      paramRow.PARAMETERTYPE = MachineConstantType.BIT
      paramRow.DEFAULTVALUE = param.value ? 1 : 0
    } else if (param.type === 'list') {
      paramRow.PARAMETERTYPE = MachineConstantType.LIST
      const options = param.options.split(',').map(o => o.trim())
      paramRow.SELECTIONLIST = options.map(o => `"${o}"`).join(' ')
      paramRow.SELECTIONVALUES = options.map((_, i) => `"${i}"`).join(' ')
      paramRow.DEFAULTVALUE = param.value
      paramRow.PARAMLOWLIMIT = 0
      paramRow.PARAMHIGHLIMIT = options.length - 1
    } else if (param.type === 'value') {
      paramRow.PARAMETERTYPE = MachineConstantType.NUMBER
      paramRow.DEFAULTVALUE = param.value
    } else {
      ctx.errors.push({
        code: INVALID_PARAMETER_TYPE_ERROR,
        details: {
          category: 'machine-parameter',
          parameter: param,
        },
      })
      continue
    }
    rows.push(paramRow)
    ctx.messages.push(parseLocalizedString(param.label))
  }

  await trx('BFMACHPARAMETERS').delete().where('MACHINEID', machineId)
  await insertBatch(trx, 'BFMACHPARAMETERS', rows)
}
