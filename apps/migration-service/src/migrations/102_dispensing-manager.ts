import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const dispenserSettingsColumns = await knex('DYTFDISPENSERSETTINGS').columnInfo()
  const dySettingsColumns = await knex('DYTFDYSETTINGS').columnInfo()
  const recipeStepColumns = await knex('DYBFBATCHORDERRECIPESTEPS').columnInfo()

  if (!dySettingsColumns.SHOWRECIPEAMOUNT) {
    await knex.schema.alterTable('DYTFDYSETTINGS', (table) => {
      table.boolean('SHOWRECIPEAMOUNT').defaultTo(false)
    })
  }
  if (
    !dispenserSettingsColumns.VNCPORT
    || !dispenserSettingsColumns.VNCPASSWORD
    || !dispenserSettingsColumns.CONNECTIONCONTROLDATE
    || !dispenserSettingsColumns.CONNECTIONSTATUS
    || !dispenserSettingsColumns.EXPORTFILENAME
    || !dispenserSettingsColumns.EXPORTIRRELEVANTCONSUMPTION
  ) {
    await knex.schema.alterTable('DYTFDISPENSERSETTINGS', (table) => {
      if (!dispenserSettingsColumns.VNCPORT) {
        table.integer('VNCPORT').defaultTo(5900).nullable()
      }
      if (!dispenserSettingsColumns.VNCPASSWORD) {
        table.string('VNCPASSWORD', 40).defaultTo('q').nullable()
      }
      if (!dispenserSettingsColumns.CONNECTIONCONTROLDATE) {
        table.datetime('CONNECTIONCONTROLDATE')
      }
      if (!dispenserSettingsColumns.CONNECTIONSTATUS) {
        table.tinyint('CONNECTIONSTATUS', 1)
      }
      if (!dispenserSettingsColumns.EXPORTFILENAME) {
        table.string('EXPORTFILENAME', 50)
      }
      if (!dispenserSettingsColumns.EXPORTIRRELEVANTCONSUMPTION) {
        table.boolean('EXPORTIRRELEVANTCONSUMPTION')
      }
    })
    await knex('DYTFDISPENSERSETTINGS')
      .update({ VNCPORT: 5900, VNCPASSWORD: 'q' })
      .whereNull('VNCPORT')
      .orWhereNull('VNCPASSWORD')
  }
  if (!recipeStepColumns.RECIPEAMOUNT) {
    await knex.schema.alterTable('DYBFBATCHORDERRECIPESTEPS', (table) => {
      table.float('RECIPEAMOUNT', 53)
    })
  }
}

export async function down(knex: Knex) {
  const dispenserSettingsColumns = await knex('DYTFDISPENSERSETTINGS').columnInfo()
  const dySettingsColumns = await knex('DYTFDYSETTINGS').columnInfo()
  const recipeStepColumns = await knex('DYBFBATCHORDERRECIPESTEPS').columnInfo()

  if (dySettingsColumns.SHOWRECIPEAMOUNT) {
    await knex.schema.alterTable('DYTFDYSETTINGS', (table) => {
      table.dropColumn('SHOWRECIPEAMOUNT')
    })
  }
  if (
    dispenserSettingsColumns.VNCPORT
    || dispenserSettingsColumns.VNCPASSWORD
    || dispenserSettingsColumns.CONNECTIONCONTROLDATE
    || dispenserSettingsColumns.CONNECTIONSTATUS
    || dispenserSettingsColumns.EXPORTFILENAME
    || dispenserSettingsColumns.EXPORTIRRELEVANTCONSUMPTION
  ) {
    await knex.schema.alterTable('DYTFDISPENSERSETTINGS', (table) => {
      if (dispenserSettingsColumns.VNCPORT) {
        table.dropColumn('VNCPORT')
      }
      if (dispenserSettingsColumns.VNCPASSWORD) {
        table.dropColumn('VNCPASSWORD')
      }
      if (dispenserSettingsColumns.CONNECTIONCONTROLDATE) {
        table.dropColumn('CONNECTIONCONTROLDATE')
      }
      if (dispenserSettingsColumns.CONNECTIONSTATUS) {
        table.dropColumn('CONNECTIONSTATUS')
      }
      if (dispenserSettingsColumns.EXPORTFILENAME) {
        table.dropColumn('EXPORTFILENAME')
      }
      if (dispenserSettingsColumns.EXPORTIRRELEVANTCONSUMPTION) {
        table.dropColumn('EXPORTIRRELEVANTCONSUMPTION')
      }
    })
  }
  if (recipeStepColumns.RECIPEAMOUNT) {
    await knex.schema.alterTable('DYBFBATCHORDERRECIPESTEPS', (table) => {
      table.dropColumn('RECIPEAMOUNT')
    })
  }
}
