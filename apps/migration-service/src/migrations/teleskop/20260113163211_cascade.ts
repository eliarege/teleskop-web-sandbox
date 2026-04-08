import type { Knex } from 'knex'

// Introduce CASCADE on foreign keys for BFPROJECTMESSAGES and BFPROJECTTRANSLATIONS
export async function up(knex: Knex) {
  await knex.schema.alterTable('BFPROJECTTRANSLATIONS', async (table) => {
    table.dropForeign(['machine_id', 'message_id'])
  })

  await knex.schema.alterTable('BFPROJECTMESSAGES', async (table) => {
    table.dropForeign(['machine_id'])
  })

  await knex.schema.alterTable('BFPROJECTMESSAGES', (table) => {
    table.foreign(['machine_id'])
      .references(['MACHINEID'])
      .inTable('BFMACHINES')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })

  await knex.schema.alterTable('BFPROJECTTRANSLATIONS', (table) => {
    table.foreign(['machine_id', 'message_id'])
      .references(['machine_id', 'message_id'])
      .inTable('BFPROJECTMESSAGES')
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex) {
  await knex.schema.alterTable('BFPROJECTTRANSLATIONS', async (table) => {
    table.dropForeign(['machine_id', 'message_id'])
  })

  await knex.schema.alterTable('BFPROJECTMESSAGES', async (table) => {
    table.dropForeign(['machine_id'])
  })

  await knex.schema.alterTable('BFPROJECTMESSAGES', (table) => {
    table.foreign(['machine_id'])
      .references(['MACHINEID'])
      .inTable('BFMACHINES')
  })

  await knex.schema.alterTable('BFPROJECTTRANSLATIONS', (table) => {
    table.foreign(['machine_id', 'message_id'])
      .references(['machine_id', 'message_id'])
      .inTable('BFPROJECTMESSAGES')
  })
}
