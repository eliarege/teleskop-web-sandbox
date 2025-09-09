import { describe, expect, it } from 'vitest'
import { type LegacyTranslationRow, migrateTranslations } from '../server/migrations/001_migration'

describe('migrateTranslations', () => {
  it('should migrate a single machine with one locale', () => {
    const input: LegacyTranslationRow[] = [
      {
        machine_id: 1,
        from_locale: 0, // tr
        to_locale: 0, // tr
        messages: JSON.stringify({ Merhaba: 'Merhaba' }),
      },
      {
        machine_id: 1,
        from_locale: 0, // tr
        to_locale: 1, // en-GB
        messages: JSON.stringify({ Merhaba: 'Hello' }),
      },
    ]
    const { messages, translations } = migrateTranslations(input)
    expect(messages).toEqual([
      { machine_id: 1, message_id: 0, note: 'Merhaba' },
    ])
    expect(translations).toEqual([
      { machine_id: 1, message_id: 0, locale_id: 0, text: 'Merhaba' },
      { machine_id: 1, message_id: 0, locale_id: 1, text: 'Hello' },
    ])
  })

  it('should migrate multiple machines and locales', () => {
    const input: LegacyTranslationRow[] = [
      {
        machine_id: 2,
        from_locale: 1, // en-GB
        to_locale: 0, // tr
        messages: JSON.stringify({ Goodbye: 'Güle Güle' }),
      },
      {
        machine_id: 2,
        from_locale: 1, // en-GB
        to_locale: 1, // en-GB
        messages: JSON.stringify({ Goodbye: 'Goodbye' }),
      },
      {
        machine_id: 2,
        from_locale: 1, // en-GB
        to_locale: 17, // de
        messages: JSON.stringify({ Goodbye: 'Auf Wiedersehn' }),
      },
    ]
    const { messages, translations } = migrateTranslations(input)
    expect(messages).toEqual([
      { machine_id: 2, message_id: 0, note: 'Goodbye' },
    ])
    expect(translations).toEqual(expect.arrayContaining([
      { machine_id: 2, message_id: 0, locale_id: 0, text: 'Güle Güle' },
      { machine_id: 2, message_id: 0, locale_id: 1, text: 'Goodbye' },
      { machine_id: 2, message_id: 0, locale_id: 17, text: 'Auf Wiedersehn' },
    ]))
  })

  it('should handle multiple messages per machine', () => {
    const input = [
      {
        machine_id: 3,
        from_locale: 0, // tr
        to_locale: 0, // tr
        messages: JSON.stringify({ 'Merhaba': 'Merhaba', 'Güle Güle': 'Güle Güle' }),
      },
    ]
    const { messages, translations } = migrateTranslations(input)
    expect(messages).toEqual([
      { machine_id: 3, message_id: 0, note: 'Merhaba' },
      { machine_id: 3, message_id: 1, note: 'Güle Güle' },
    ])
    expect(translations).toEqual([
      { machine_id: 3, message_id: 0, locale_id: 0, text: 'Merhaba' },
      { machine_id: 3, message_id: 1, locale_id: 0, text: 'Güle Güle' },
    ])
  })

  it('should handle empty messages', () => {
    const input = [
      {
        machine_id: 4,
        from_locale: 0, // tr
        to_locale: 0, // tr
        messages: JSON.stringify({}),
      },
    ]
    const { messages, translations } = migrateTranslations(input)
    expect(messages).toHaveLength(0)
    expect(translations).toHaveLength(0)
  })

  it('should migrate multiple machines with multiple messages', () => {
    const input: LegacyTranslationRow[] = [
      // Machine 5
      {
        machine_id: 5,
        from_locale: 0, // tr
        to_locale: 0, // tr
        messages: JSON.stringify({ 'Merhaba': 'Merhaba', 'Güle Güle': 'Güle Güle' }),
      },
      {
        machine_id: 5,
        from_locale: 0,
        to_locale: 1, // en-GB
        messages: JSON.stringify({ 'Merhaba': 'Hello', 'Güle Güle': 'Goodbye' }),
      },
      // Machine 6
      {
        machine_id: 6,
        from_locale: 1, // en-GB
        to_locale: 1, // en-GB
        messages: JSON.stringify({ Hello: 'Hello', Goodbye: 'Goodbye' }),
      },
      {
        machine_id: 6,
        from_locale: 1,
        to_locale: 0, // tr
        messages: JSON.stringify({ Hello: 'Merhaba', Goodbye: 'Güle Güle' }),
      },
    ]
    const { messages, translations } = migrateTranslations(input)
    expect(messages).toEqual(expect.arrayContaining([
      { machine_id: 5, message_id: 0, note: 'Merhaba' },
      { machine_id: 5, message_id: 1, note: 'Güle Güle' },
      { machine_id: 6, message_id: 0, note: 'Hello' },
      { machine_id: 6, message_id: 1, note: 'Goodbye' },
    ]))
    expect(translations).toEqual(expect.arrayContaining([
      { machine_id: 5, message_id: 0, locale_id: 0, text: 'Merhaba' },
      { machine_id: 5, message_id: 0, locale_id: 1, text: 'Hello' },
      { machine_id: 5, message_id: 1, locale_id: 0, text: 'Güle Güle' },
      { machine_id: 5, message_id: 1, locale_id: 1, text: 'Goodbye' },
      { machine_id: 6, message_id: 0, locale_id: 1, text: 'Hello' },
      { machine_id: 6, message_id: 0, locale_id: 0, text: 'Merhaba' },
      { machine_id: 6, message_id: 1, locale_id: 1, text: 'Goodbye' },
      { machine_id: 6, message_id: 1, locale_id: 0, text: 'Güle Güle' },
    ]))
  })

  it('should ignore machines with corrupted messages', () => {
    const input: LegacyTranslationRow[] = [
      {
        machine_id: 7,
        from_locale: 0,
        to_locale: 0,
        messages: 'not a json', // corrupted
      },
      {
        machine_id: 7,
        from_locale: 0,
        to_locale: 1,
        messages: JSON.stringify({ Merhaba: 'Hello' }),
      },
    ]
    const { messages, translations } = migrateTranslations(input)
    expect(messages).toHaveLength(0)
    expect(translations).toHaveLength(0)
  })

  it('should ignore translation keys not present in original locale', () => {
    const input: LegacyTranslationRow[] = [
      {
        machine_id: 8,
        from_locale: 0,
        to_locale: 0,
        messages: JSON.stringify({ Merhaba: 'Merhaba' }),
      },
      {
        machine_id: 8,
        from_locale: 0,
        to_locale: 1,
        messages: JSON.stringify({ 'Merhaba': 'Hello', 'Güle Güle': 'Goodbye' }), // 'Güle Güle' not in original
      },
    ]
    const { messages, translations } = migrateTranslations(input)
    expect(messages).toEqual([
      { machine_id: 8, message_id: 0, note: 'Merhaba' },
    ])
    expect(translations).toEqual([
      { machine_id: 8, message_id: 0, locale_id: 0, text: 'Merhaba' },
      { machine_id: 8, message_id: 0, locale_id: 1, text: 'Hello' },
    ])
  })

  it('should ignore machines where original locale does not exist', () => {
    const input: LegacyTranslationRow[] = [
      {
        machine_id: 9,
        from_locale: 0,
        to_locale: 1,
        messages: JSON.stringify({ Merhaba: 'Hello' }),
      },
      // No row for machine_id: 9, from_locale: 0, to_locale: 0
    ]
    const { messages, translations } = migrateTranslations(input)
    expect(messages).toHaveLength(0)
    expect(translations).toHaveLength(0)
  })
})
