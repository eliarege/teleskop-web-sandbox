import { db } from '../db'

export default defineEventHandler(async (event) => {
  const { locale } = getQuery(event)
  try {
    const rows = await db('BFMACHINETRANSLATIONS')
      .select('machine_id', 'messages')
      .where('to_locale', locale)

    const result: Record<number, any> = {}
    const mergedMessages: Record<string, string> = {}
    const seenKeys: Set<string> = new Set()

    for (const row of rows) {
      let parsedMessages: Record<string, string> = {}

      try {
        parsedMessages = JSON.parse(row.messages)
        result[row.machine_id] = parsedMessages
      } catch (err: any) {
        console.error(`Invalid JSON for ${row.machine_id}:`, err)
        continue
      }

      for (const [key, value] of Object.entries(parsedMessages)) {
        if (!seenKeys.has(key)) {
          mergedMessages[key] = value
          seenKeys.add(key)
        }
      }
    }

    result[0] = mergedMessages

    return result
  } catch (err: any) {
    console.error('Database query failed:', err)
    throw new Error('Database query failed:', err)
  }
})
