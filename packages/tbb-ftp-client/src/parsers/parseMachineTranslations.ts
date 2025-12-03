import { splitLines } from '../utils/common'

export function parseMachineTranslations(content: string) {
  const lines = splitLines(content)
  const messages: { locale: number, text: string }[][] = []

  for (const line of lines) {
    const parts = line.split('~')
    const row: { locale: number, text: string }[] = []

    parts.forEach((text, index) => {
      const trimmed = text.trim()
      if (trimmed !== '') {
        row.push({ locale: index, text: trimmed })
      }
    })

    if (row.length > 0) {
      messages.push(row)
    }
  }

  return messages
}
