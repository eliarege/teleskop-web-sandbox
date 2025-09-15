import { TonelloApi } from '@teleskop/core'
import { knex } from '../../connectionPool'
import type { UpdateContext } from '../types'
import { updateTonelloFunctions } from './functions'
import { updateTonelloInputOutputs } from './input-output'
import { updateTonelloProjectTranslations } from './locale'
import { updateTonelloMachineParameteres } from './machine-constants'
import { TonelloUpdateError } from './errors'

export async function downloadTonelloProject(
  machineId: number,
  machineHost: string,
) {
  const api = new TonelloApi(`http://${machineHost}:1234`)
  const ctx: UpdateContext = {
    errors: [],
    messages: [],
  }

  const functions = await api.fetchFunctions()
  const ioList = await api.fetchInputOutputList()
  const config = await api.fetchConfiguration()
  const parameters = config.data.pages.flatMap(p => p.params)

  await knex.transaction(async (trx) => {
    await updateTonelloFunctions(trx, machineId, functions.data.layout.pages, ctx)
    await updateTonelloMachineParameteres(trx, machineId, parameters, ctx)
    await updateTonelloInputOutputs(trx, machineId, ioList.data)
    if (ctx.errors.length > 0) {
      throw new TonelloUpdateError('Errors occurred during Tonello project update', ctx.errors)
    }
    await updateTonelloProjectTranslations(trx, machineId, ctx.messages)
  })
}
