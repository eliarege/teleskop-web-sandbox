import process from 'node:process'
import { inferBoolean } from '@teleskop/utils'
import { knex } from '../connectionPool'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const { addMissingTeleskopColumns } = config
  if (inferBoolean(addMissingTeleskopColumns)) {
    try {
      const columns = await knex('DYTFDISPENSERSETTINGS').columnInfo()

      if (!columns.VNCPORT || !columns.VNCPASSWORD) {
        await knex.schema.table('DYTFDISPENSERSETTINGS', (table) => {
          table.integer('VNCPORT').defaultTo(5900).nullable()
          table.string('VNCPASSWORD', 40).defaultTo('q').nullable()
        })
        console.log('Added VNCPORT column with default value 5900')
        console.log('Added VNCPASSWORD column with default value \'q\'')
        await knex('DYTFDISPENSERSETTINGS').update({ VNCPORT: 5900, VNCPASSWORD: 'q' }).whereNull('VNCPORT').orWhereNull('VNCPASSWORD')
      }
    } catch (e) {
      console.error('Failed to create VNC columns', e)
      if (!import.meta.dev) {
        process.exit(1)
      }
    }
  }
})
