export function splitLines(content: string): string[] {
  return content.split('\n').map(l => l.trim()).filter(Boolean)
}

export function splitOnce(content: string, separator: string): [string, string] {
  const index = content.indexOf(separator)
  if (index === -1) {
    return [content, '']
  }
  const firstPart = content.slice(0, index)
  const secondPart = content.slice(index + separator.length)
  return [firstPart, secondPart]
}
