import type { BFPROJECTMESSAGES, BFPROJECTTRANSLATIONS, TonelloLocale } from '@teleskop/core'
import { ProjectLocale } from '@teleskop/core'
import type { ValueOf } from '@teleskop/utils'
import { insertBatch, isDef } from '@teleskop/utils'
import type { Knex } from 'knex'
import type { MssqlError } from '~/server/error'
import { DatabaseQueryError } from '~/server/error'

export type TonelloLocalizedMessage = {
  locale: TonelloLocale
  message: string
}

export const localeMappings: Readonly<Record<TonelloLocale, ValueOf<typeof ProjectLocale>>> = {
  ENU: ProjectLocale.English,
  ITA: ProjectLocale.Italian,
}

export const DEFAULT_LOCALE = 'ENU' satisfies TonelloLocale

/**
 * Parses a localized string into an array of objects with locale and message.
 *
 * @example
 * ```ts
 * import { assertEquals, assertObjectMatch } from 'jsr:@std/assert'
 * const output = parseLocalizedString('ENU=Hello,ITA=Salve')
 *
 * assertEquals(output.length, 2)
 * assertObjectMatch(output[0], { locale: 'ENU', message: 'Hello' })
 * assertObjectMatch(output[1], { locale: 'ITA', message: 'Salve' })
 *
 * ```
 *
 * @param str The string to parse, formatted as `locale=message,locale=message,...`.
 * @returns An array of objects with `locale` and `message` properties.
 */
export function parseLocalizedString(str: string) {
  return str
    .split(',')
    .map((label) => {
      const [locale, message = ''] = label.split('=')
      if (!locale)
        return null
      return { locale, message }
    })
    .filter(Boolean) as TonelloLocalizedMessage[]
}

/**
 * Extracts a localized message from a string.
 *
 * @example
 * ```ts
 * import { assertEquals } from 'jsr:@std/assert'
 *
 * const output = extractLocalizedMessage('ENU=Hello,ITA=Salve', 'ITA')
 * assertEquals(output, 'Salve')
 *
 * ```
 *
 * @param str The string to extract the message from.
 * @param locale The locale to extract the message for.
 * @returns The extracted message, or undefined if not found.
 */
export function extractLocalizedMessage(
  str: string,
  locale: TonelloLocale = DEFAULT_LOCALE,
): string | undefined {
  const parsed = parseLocalizedString(str)
  const extract = parsed.find(p => p.locale === locale)
  return extract?.message
}

export async function updateTonelloProjectTranslations(
  trx: Knex.Transaction,
  machineId: number,
  messages: TonelloLocalizedMessage[][],
) {
  const messageRows: BFPROJECTMESSAGES[] = []
  const translationRows: BFPROJECTTRANSLATIONS[] = []

  for (const [messageId, localeMessages] of messages.entries()) {
    const defaultMessage = localeMessages.find(lm => lm.locale === DEFAULT_LOCALE)
    messageRows.push({
      machine_id: machineId,
      message_id: messageId,
      note: defaultMessage?.message.substring(0, 255) || '',
    })
    for (const localeMessage of localeMessages) {
      const localeId = localeMappings[localeMessage.locale]
      if (!isDef(localeId)) {
        // Skip unknown locales
        continue
      }
      if (localeMessage.message) {
        translationRows.push({
          machine_id: machineId,
          message_id: messageId,
          locale_id: localeId,
          text: localeMessage.message,
        })
      }
    }
  }

  try {
    await trx('BFPROJECTTRANSLATIONS').where({ machine_id: machineId }).del()
    await trx('BFPROJECTMESSAGES').where({ machine_id: machineId }).del()
    await insertBatch(trx, 'BFPROJECTMESSAGES', messageRows)
    await insertBatch(trx, 'BFPROJECTTRANSLATIONS', translationRows)
  } catch (error) {
    throw new DatabaseQueryError('Failed to update Tonello project translations', {
      cause: error as AggregateError | MssqlError,
    })
  }
}
