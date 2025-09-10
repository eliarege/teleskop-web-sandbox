import type { Knex } from 'knex'
import { insertBatch } from '@teleskop/utils'
import { supportedProjectLocales } from '../../shared/constants'

export type LegacyTranslationRow = {
  machine_id: number
  from_locale: number
  to_locale: number
  messages: string // jsonb
}

export type ProjectMessageRow = {
  machine_id: number
  message_id: number
  note: string
}

export type ProjectTranslationRow = {
  machine_id: number
  message_id: number
  locale_id: number
  text: string
}

export async function up(knex: Knex) {
  let legacyTranslations: LegacyTranslationRow[] = []

  if (await knex.schema.hasTable('BFMACHINETRANSLATIONS')) {
    legacyTranslations = await knex
      .from('BFMACHINETRANSLATIONS')
      .select('*')
    await knex.schema.dropTable('BFMACHINETRANSLATIONS')
  }

  await knex.schema.createTable('BFPROJECTMESSAGES', (table) => {
    table.integer('machine_id').unsigned().notNullable()
    table.integer('message_id').unsigned().notNullable()
    table.string('note').nullable()
    table.primary(['machine_id', 'message_id'])
    table.foreign(['machine_id'])
      .references(['MACHINEID'])
      .inTable('BFMACHINES')
  })

  await knex.schema.createTable('BFPROJECTLOCALE', (table) => {
    table.integer('id').unsigned().primary()
    table.string('code').notNullable()
    table.string('name').notNullable()
  })

  await knex.schema.createTable('BFPROJECTTRANSLATIONS', (table) => {
    table.integer('machine_id').unsigned().notNullable()
    table.integer('message_id').unsigned().notNullable()
    table.integer('locale_id').unsigned().notNullable()
    table.string('text').notNullable()
    table.primary(['machine_id', 'message_id', 'locale_id'])
    table.foreign(['machine_id', 'message_id'])
      .references(['machine_id', 'message_id'])
      .inTable('BFPROJECTMESSAGES')
    table.foreign('locale_id')
      .references('id')
      .inTable('BFPROJECTLOCALE')
  })

  await knex.from('BFPROJECTLOCALE').insert(supportedProjectLocales.map(locale => ({
    id: locale.id,
    code: locale.code,
    name: locale.name,
  })))

  if (legacyTranslations.length > 0) {
    const { messages, translations } = migrateTranslations(legacyTranslations)
    await insertBatch(knex, 'BFPROJECTMESSAGES', messages)
    await insertBatch(knex, 'BFPROJECTTRANSLATIONS', translations)
  }
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('BFPROJECTTRANSLATIONS')
  await knex.schema.dropTable('BFPROJECTLOCALE')
  await knex.schema.dropTable('BFPROJECTMESSAGES')
}

/** Migrate legacy translations to new format */
export function migrateTranslations(legacyTranslations: LegacyTranslationRow[]) {
  const messageRows = [] as ProjectMessageRow[]
  const translationRows = [] as ProjectTranslationRow[]

  const legacyTranslationsByMachine = {} as Record<number, LegacyTranslationRow[]>
  for (const lt of legacyTranslations) {
    legacyTranslationsByMachine[lt.machine_id] ??= []
    legacyTranslationsByMachine[lt.machine_id].push(lt)
  }

  for (const [machineIdStr, ltm] of Object.entries(legacyTranslationsByMachine)) {
    const machineId = Number.parseInt(machineIdStr)
    try {
      const originalLocale = ltm.find(m => m.from_locale === m.to_locale)
      if (!originalLocale) {
        continue
      }
      const projectMessages = Object.keys(JSON.parse(originalLocale.messages))
      const keyToMessageId = new Map<string, number>()

      for (const [msgId, msg] of projectMessages.entries()) {
        keyToMessageId.set(msg, msgId)
        messageRows.push({
          machine_id: machineId,
          message_id: msgId,
          note: msg,
        })
        translationRows.push({
          machine_id: machineId,
          message_id: msgId,
          locale_id: originalLocale.from_locale,
          text: msg,
        })
      }
      const otherLocales = ltm.filter(m => m.from_locale !== m.to_locale)
      for (const locale of otherLocales) {
        const localeMessages = JSON.parse(locale.messages) as Record<string, string>
        for (const [key, msg] of Object.entries(localeMessages)) {
          const msgId = keyToMessageId.get(key)
          if (msgId != null) {
            translationRows.push({
              machine_id: machineId,
              message_id: msgId,
              locale_id: locale.to_locale,
              text: msg,
            })
          }
        }
      }
    } catch (err) {
      console.error(`Failed to migrate translations for machine ${machineId}: ${(err as Error).message}`)
      continue
    }
  }

  return {
    messages: messageRows,
    translations: translationRows,
  }
}
