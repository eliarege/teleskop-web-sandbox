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
        .timeout(30_000)

      await knex.schema.createTable('PTCOLUMNS', (table) => {
        table.increments('id')
        table.integer('parameterId')
        table.string('parameterName')
        table.boolean('visible')
      }).then(async () => {
        console.log('Table PTCOLUMNS created successfully')
        // TODO: Bulk insert
        await knex.transaction(async (trx) => {
          for (const row of values) {
            await trx('PTCOLUMNS').insert({
              parameterId: row.BATCHPARAMETERID,
              parameterName: row.PARAMSTRING,
              visible: false,
            })
          }
        })
          .then(() => console.log('Values inserted into PTCOLUMNS'))
          .catch(err => console.error('An error occured while inserting values into PTCOLUMNS', err))
      })
    } else {
      console.log('Table PTCOLUMNS already exists, no data inserted')
    }
  } catch (err) {
    console.error('error:', err)
  }
}

export async function createPtMachineErpTable(knex: Knex) {
  try {
    const tableExists = await knex.schema.hasTable('PTMACHINEERP')

    if (!tableExists) {
      await knex.schema.createTable('PTMACHINEERP', (table) => {
        table.increments('id')
        table.integer('paramId')
        table.integer('machineId')
        table.string('paramName')
        table.boolean('visible')
      })
      console.log('Table PTMACHINEERP created successfully')
      const values = await knex('BFMACHBATCHPARAMETERS').select({
        paramId: 'BATCHPARAMETERID',
        machineId: 'MACHINEID',
        paramName: 'PARAMSTRING',
      })
      // TODO: Bulk insert
      await knex.transaction(async (trx) => {
        for (const row of values) {
          await trx('PTMACHINEERP').insert({
            paramId: row.paramId,
            machineId: row.machineId,
            paramName: row.paramName,
            visible: false,
          })
        }
      })
        .then(() => console.log('Values inserted into PTMACHINEERP'))
        .catch(err => console.error('An error occured while inserting values into PTMACHINEERP', err))
    } else {
      console.log('Table PTMACHINEERP already exists, no data inserted')
    }
  } catch (err) {
    console.error('error:', err)
  }
}
