import process from 'node:process'
import { inferBoolean } from '@teleskop/utils'
import { knex } from '../connectionPool'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const { addMissingTeleskopColumns } = config
  if (inferBoolean(addMissingTeleskopColumns)) {
    try {
      const dispenserSettingsColumns = await knex('DYTFDISPENSERSETTINGS').columnInfo()
      const dySettingsColumns = await knex('DYTFDYSETTINGS').columnInfo()
      await knex.schema.table('DYTFDYSETTINGS', (table) => {
        if (!dySettingsColumns.SHOWRECIPEAMOUNT) {
          table.boolean('SHOWRECIPEAMOUNT').defaultTo(false)
          console.log('Added SHOWRECIPEAMOUNT column with default value "false" to DYTFDYSETTINGS')
        }
      })
      await knex.schema.table('DYTFDISPENSERSETTINGS', (table) => {
        if (!dispenserSettingsColumns.VNCPORT) {
          table.integer('VNCPORT').defaultTo(5900).nullable()
          console.log('Added VNCPORT column with default value 5900 to DYTFDISPENSERSETTINGS')
        }
        if (!dispenserSettingsColumns.VNCPASSWORD) {
          table.string('VNCPASSWORD', 40).defaultTo('q').nullable()
          console.log('Added VNCPASSWORD column with default value \'q\' to DYTFDISPENSERSETTINGS')
        }
        if (!dispenserSettingsColumns.CONNECTIONCONTROLDATE) {
          table.datetime('CONNECTIONCONTROLDATE', { precision: 23 })
          console.log('Added CONNECTIONCONTROLDATE column to DYTFDISPENSERSETTINGS')
        }
        if (!dispenserSettingsColumns.CONNECTIONSTATUS) {
          table.tinyint('CONNECTIONSTATUS', 1)
          console.log('Added CONNECTIONSTATUS to DYTFDISPENSERSETTINGS')
        }
        if (!dispenserSettingsColumns.EXPORTFILENAME) {
          table.string('EXPORTFILENAME', 50)
          console.log('Added EXPORTFILENAME to DYTFDISPENSERSETTINGS')
        }
        if (!dispenserSettingsColumns.EXPORTIRRELEVANTCONSUMPTION) {
          table.boolean('EXPORTIRRELEVANTCONSUMPTION')
          console.log('Added EXPORTIRRELEVANTCONSUMPTION to DYTFDISPENSERSETTINGS')
        }
      })
      await knex('DYTFDISPENSERSETTINGS').update({ VNCPORT: 5900, VNCPASSWORD: 'q' }).whereNull('VNCPORT').orWhereNull('VNCPASSWORD')
      const recipeStepColumns = await knex('DYBFBATCHORDERRECIPESTEPS').columnInfo()
      await knex.schema.table('DYBFBATCHORDERRECIPESTEPS', (table) => {
        if (!recipeStepColumns.RECIPEAMOUNT)
          table.float('RECIPEAMOUNT', 53)
        console.log('Added RECIPEAMOUNT to DYBFBATCHORDERRECIPESTEPS')
      })
    } catch (e) {
      console.error('Failed to create missing Teleskop columns', e)
      if (!import.meta.dev) {
        process.exit(1)
      }
    }
  }
})
