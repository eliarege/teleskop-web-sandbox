import { z } from 'zod'
import { db } from '../db'
import { supportedProjectLocales } from '../../shared/constants'

const querySchema = z.object({
  locale: z
    .enum(supportedProjectLocales.map(l => l.code) as [string, ...string[]]),
})

export default defineAuthEventHandler(async (event) => {
  const query = getQuery(event)
  const { locale } = querySchema.parse(query)
  const localeId = supportedProjectLocales.find(l => l.code === locale)!.id
  const machineTranslations = await fetchMachineTranslations(localeId)
  const globalTranslations = await fetchGlobalTranslations(localeId)

  return { global: globalTranslations, machine: machineTranslations }
})

/**
 * Fetches machine translations for a given locale.
 *
 * This function queries the database to retrieve translation keys and their corresponding
 * values for each machine, based on the specified locale ID. It first determines the
 * source project language for each machine, then joins translation keys and values
 * for the requested locale, and finally returns a nested record mapping machine IDs
 * to their translation key-value pairs.
 *
 * @param localeId - The ID of the locale for which translations should be fetched.
 * @returns A promise that resolves to an object mapping machine IDs to their translation key-value pairs.
 */

async function fetchMachineTranslations(localeId: number): Promise<Record<string, Record<string, string>>> {
  const kv = await db.with('sp', (q) => {
    return q
      .from('BFMACHINESYSTEMPARAMS')
      .select({
        machine_id: 'MachineId',
        project_locale: 'ParamValue',
      })
      .where('ParamToken', 'FROM_PROJECT_LANGUAGE')
      .andWhere('ParamValue', '!=', `${localeId}`)
  })
    .with('keys', (q) => {
      return q
        .from('BFPROJECTTRANSLATIONS as pt')
        .select({
          machine_id: 'pt.machine_id',
          message_id: 'pt.message_id',
          text: 'pt.text',
        })
        .join('sp', function () {
          this.on('sp.project_locale', 'pt.locale_id')
            .andOn('sp.machine_id', 'pt.machine_id')
        })
    })
    .with('vals', (q) => {
      return q
        .from('BFPROJECTTRANSLATIONS')
        .select({
          machine_id: 'machine_id',
          message_id: 'message_id',
          text: 'text',
        })
        .where('locale_id', localeId)
    })
    .from('keys as k')
    .join('vals as v', function () {
      this.on('k.message_id', 'v.message_id')
        .andOn('k.machine_id', 'v.machine_id')
    })
    .select({
      machine_id: 'k.machine_id',
      key: 'k.text',
      value: 'v.text',
    })

  const result = {} as Record<string, Record<string, string>>
  kv.forEach((row) => {
    result[row.machine_id] ??= {}
    result[row.machine_id][row.key] = row.value
  })
  return result
}

/**
 * Fetches a mapping of global translation keys and their corresponding values for a given locale.
 *
 * This function queries the `BFPROJECTTRANSLATIONS` table to find translation entries for the specified `localeId`
 * and compares them with entries from other locales. It returns a record where each key is a translation text from
 * another locale, and the value is the corresponding translation text for the specified locale, only if the texts differ.
 *
 * @param localeId - The ID of the locale for which translations should be fetched.
 * @returns A promise that resolves to a record mapping translation keys to their localized values.
 */
async function fetchGlobalTranslations(localeId: number): Promise<Record<string, string>> {
  const kv = await db
    .with('keys', (q) => {
      return q
        .from('BFPROJECTTRANSLATIONS')
        .select('message_id', 'text')
        .where('locale_id', '!=', localeId)
    })
    .with('vals', (q) => {
      return q
        .from('BFPROJECTTRANSLATIONS')
        .select('message_id', 'text')
        .where('locale_id', '=', localeId)
    })
    .distinct({
      key: 'k.text',
      value: 'v.text',
    })
    .from('keys as k')
    .join('vals as v', function () {
      this.on('k.message_id', 'v.message_id')
        .andOn('k.text', '!=', 'v.text')
    })

  const result: Record<string, string> = {}
  kv.forEach((row) => {
    result[row.key] = row.value
  })
  return result
}
