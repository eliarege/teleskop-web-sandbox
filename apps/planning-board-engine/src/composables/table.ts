import type { Knex } from 'knex'
import { logger } from './logger'

export async function createPtColumnsTable(knex: Knex) {
  try {
    const tableExists = await knex.schema.hasTable('PTCOLUMNS')

    if (!tableExists) {
      const values = await knex('DYBFBATCHPLANPARAMETERS as d')
        .distinct('d.PARAMSTRING', 'd.BATCHPARAMETERID')
        .join('BADATA as b', 'd.PLANKEY', 'b.PLANKEY')
        .where('d.PARAMSTRING', '<>', '')
        .orderBy('d.BATCHPARAMETERID', 'asc')
        .timeout(30_000)

      await knex.schema.createTable('PTCOLUMNS', (table) => {
        table.increments('id')
        table.integer('parameterId')
        table.string('parameterName')
        table.boolean('visible')
      }).then(async () => {
        logger.info('Table PTCOLUMNS created successfully')
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
          .then(() => logger.info('Values inserted into PTCOLUMNS'))
          .catch(err => logger.error(err, 'An error occured while inserting values into PTCOLUMNS'))
      })
    } else {
      logger.info('Table PTCOLUMNS already exists, no data inserted')
    }
  } catch (err) {
    logger.error(err, 'error:')
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
      logger.info('Table PTMACHINEERP created successfully')
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
        .then(() => logger.info('Values inserted into PTMACHINEERP'))
        .catch(err => logger.error(err, 'An error occured while inserting values into PTMACHINEERP'))
    } else {
      logger.info('Table PTMACHINEERP already exists, no data inserted')
    }
  } catch (err) {
    logger.error(err, 'error:')
  }
}
