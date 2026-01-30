export function formatDuration(ms: number, withSeconds = false): string {
  const sec = Math.abs(ms / 1000)
  const isNegative = ms < 0
  const seconds = Math.floor(sec % 60)
  const minutes = Math.floor((sec % 3600) / 60)
  const hours = Math.floor(sec / 3600)

  const pad = (num: number) => num.toString().padStart(2, '0')
  const string = `${isNegative ? '-' : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  return withSeconds ? string : string.slice(0, -3)
}
