import process from 'node:process'
import { inferBoolean } from '@teleskop/utils'
import { knex } from '../connectionPool'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const { addMissingTeleskopColumns } = config
  if (inferBoolean(addMissingTeleskopColumns)) {
    try {
      const dispenserSettingsColumns = await knex('DYTFDISPENSERSETTINGS').columnInfo()

      await knex.schema.table('DYTFDISPENSERSETTINGS', (table) => {
        if (!dispenserSettingsColumns.VNCPORT) {
          table.integer('VNCPORT').defaultTo(5900).nullable()
          console.log('Added VNCPORT column with default value 5900')
        }
        if (!dispenserSettingsColumns.VNCPASSWORD) {
          table.string('VNCPASSWORD', 40).defaultTo('q').nullable()
          console.log('Added VNCPASSWORD column with default value \'q\'')
        }
        if (!dispenserSettingsColumns.CONNECTIONSTATUS) {
          table.datetime('CONNECTIONCONTROLDATE', { precision: 23 })
          console.log('Added CONNECTIONCONTROLDATE column')
        }
        if (!dispenserSettingsColumns.CONNECTIONCONTROLDATE) {
          table.tinyint('CONNECTIONSTATUS', 1)
          console.log('Added CONNECTIONSTATUS dispenserSettingsColumns')
        }
      })
      await knex('DYTFDISPENSERSETTINGS').update({ VNCPORT: 5900, VNCPASSWORD: 'q' }).whereNull('VNCPORT').orWhereNull('VNCPASSWORD')
      const recipeStepColumns = await knex('DYBFBATCHORDERRECIPESTEPS').columnInfo()
      await knex.schema.table('DYBFBATCHORDERRECIPESTEPS', (table) => {
        if (!recipeStepColumns.RECIPEAMOUNT)
          table.float('RECIPEAMOUNT', 53)
      })
    } catch (e) {
      console.error('Failed to create DYTFDISPENSERSETTINS columns', e)
      if (!import.meta.dev) {
        process.exit(1)
      }
    }
  }
})
