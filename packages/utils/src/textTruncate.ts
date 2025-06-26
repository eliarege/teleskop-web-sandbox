export function textTruncate(content: string, truncateFrom: number): { content: string, tooltip: boolean } {
  if (content && content.length > truncateFrom) {
    const newContent = `${content.slice(0, truncateFrom)}...`
    if (newContent.length >= content.length) {
      return { content, tooltip: false }
    } else return { content: `${content.slice(0, truncateFrom)}...`, tooltip: true }
  } else {
    return { content, tooltip: false }
  }
}
