export function parseMachineTranslations(fromLocale: number, content: string, machineId: number) {
  const lines = content.split('\n').filter(Boolean)
  const translationsPerLocale: any[] = []

  for (const line of lines) {
    const parts = line.split('~')
    const source = parts[fromLocale]?.trim()

    if (!source)
      continue

    parts.forEach((targetRaw, index) => {
      if (targetRaw) {
        const target = targetRaw?.trim()
        if (!target)
          return

        let localeEntry = translationsPerLocale.find(
          entry => entry.to_locale === index,
        )

        if (!localeEntry) {
          localeEntry = {
            machine_id: machineId,
            from_locale: fromLocale,
            to_locale: index,
            messages: {},
          }
          translationsPerLocale.push(localeEntry)
        }

        localeEntry.messages[source] = target
      }
    })
  }
  return translationsPerLocale
}