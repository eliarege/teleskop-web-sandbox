import type { Knex } from 'knex'
import { chunk } from 'lodash-es'
import { logger } from './logger'

export async function createPtColumnsTable(knex: Knex) {
  try {
    const tableExists = await knex.schema.hasTable('PTCOLUMNS')

    if (!tableExists) {
      await knex.schema.createTable('PTCOLUMNS', (table) => {
        table.increments('id')
        table.integer('parameterId')
        table.string('parameterName')
        table.boolean('visible')
      })
      logger.info('Table PTCOLUMNS created successfully')
    }

    const count = await knex('PTCOLUMNS').count<{ count: number }[]>('* as count')

    if (count[0].count === 0) {
      const values = await knex('DYBFBATCHPLANPARAMETERS as d')
        .distinct('d.PARAMSTRING', 'd.BATCHPARAMETERID')
        .join('BADATA as b', 'd.PLANKEY', 'b.PLANKEY')
        .where('d.PARAMSTRING', '<>', '')
        .orderBy('d.BATCHPARAMETERID', 'asc')
        .timeout(30_000)

      if (values.length > 0) {
        await knex('PTCOLUMNS').insert(
          values.map(row => ({
            parameterId: row.BATCHPARAMETERID,
            parameterName: row.PARAMSTRING,
            visible: false,
          })),
        )
        logger.info('Values inserted into PTCOLUMNS')
      } else {
        logger.info('No data found to insert into PTCOLUMNS')
      }
    } else {
      logger.info('Table PTCOLUMNS already exists and contains data, no action taken')
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
    }

    const count = await knex('PTMACHINEERP').count<{ count: number }[]>('* as count')

    if (count[0].count === 0) {
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

      const chunks = chunk(allValues, 500)
      for (const ch of chunks) {
        await knex('PTMACHINEERP').insert(ch)
      }

      logger.info(`Inserted ${allValues.length} total rows into PTMACHINEERP`)
    } else {
      logger.info('Table PTMACHINEERP already exists and contains data, no action taken')
    }
  } catch (err) {
    logger.error(err, 'error:')
  }
}
