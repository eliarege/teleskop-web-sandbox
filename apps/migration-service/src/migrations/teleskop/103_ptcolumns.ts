import { insertBatch } from '@teleskop/utils'
import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const tableExists = await knex.schema.hasTable('PTCOLUMNS')

  if (!tableExists) {
    await knex.schema.createTable('PTCOLUMNS', (table) => {
      table.increments('id')
      table.integer('parameterId')
      table.string('parameterName')
      table.boolean('visible')
    })
  }

  const countRes = await knex('PTCOLUMNS').count<{ count: number }[]>('* as count')
  const count = Number(countRes[0].count)

  if (!count) {
    const values = await knex('DYBFBATCHPLANPARAMETERS as d')
      .distinct('d.PARAMSTRING', 'd.BATCHPARAMETERID')
      .join('BADATA as b', 'd.PLANKEY', 'b.PLANKEY')
      .where('d.PARAMSTRING', '<>', '')
      .orderBy('d.BATCHPARAMETERID', 'asc')
      .timeout(30_000)

    if (values.length > 0) {
      await insertBatch(knex, 'PTCOLUMNS', values.map(row => ({
        parameterId: row.BATCHPARAMETERID,
        parameterName: row.PARAMSTRING,
        visible: false,
      })))
    }
  }
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('PTCOLUMNS')
}
