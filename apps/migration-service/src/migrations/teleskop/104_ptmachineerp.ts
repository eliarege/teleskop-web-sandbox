import { insertBatch } from '@teleskop/utils'
import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const tableExists = await knex.schema.hasTable('PTMACHINEERP')

  if (!tableExists) {
    await knex.schema.createTable('PTMACHINEERP', (table) => {
      table.increments('id')
      table.integer('paramId')
      table.integer('machineId')
      table.string('paramName')
      table.boolean('visible')
    })
  }

  const countRes = await knex('PTMACHINEERP').count<{ count: number }[]>('* as count')
  const count = Number(countRes[0].count)

  if (!count) {
    const values = await knex('BFMACHBATCHPARAMETERS').select({
      paramId: 'BATCHPARAMETERID',
      machineId: 'MACHINEID',
      paramName: 'PARAMSTRING',
    })

    const missingParams = await knex
      .select('PARAMNAME', 'PARAMID', 'MACHINEID')
      .from('BFERPPARAMETERDEFINITIONS')
      .whereNotIn('PARAMNAME', function () {
        this.select('PARAMSTRING').from('BFMACHBATCHPARAMETERS')
      })

    const extra = missingParams.map((param) => {
      return {
        paramId: param.PARAMID,
        machineId: param.MACHINEID,
        paramName: param.PARAMNAME,
        visible: false,
      }
    })
    const allValues = [
      ...values.map(row => ({
        paramId: row.paramId,
        machineId: row.machineId,
        paramName: row.paramName,
        visible: false,
      })),
      ...extra,
    ]
    await insertBatch(knex, 'PTMACHINEERP', allValues)
  }
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('PTMACHINEERP')
}
