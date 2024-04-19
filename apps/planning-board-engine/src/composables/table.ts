import type { Knex } from 'knex'

export async function createPtColumnsTable(knex: Knex) {
  try {
    const tableExists = await knex.schema.hasTable('PTCOLUMNS')

    if (!tableExists) {
      const values = await knex('DYBFBATCHPLANPARAMETERS')
        .distinct('PARAMSTRING', 'BATCHPARAMETERID')
        .where('PARAMSTRING', '<>', '')
        .select()
        .orderBy('BATCHPARAMETERID', 'asc')

      await knex.schema.createTable('PTCOLUMNS', (table) => {
        table.increments('id')
        table.integer('parameterId')
        table.string('parameterName')
        table.boolean('visible')
      })
      await knex.transaction(async (trx) => {
        for (const row of values) {
          await trx('PTCOLUMNS').insert({ parameterId: row.BATCHPARAMETERID, parameterName: row.PARAMSTRING, visible: false })
        }
      })
      console.log('Table PTCOLUMNS created and data inserted successfully')
    } else {
      console.log('Table PTCOLUMNS already exists, no data inserted')
    }
  } catch (err) {
    console.error('error:', err)
  }
}
