import type { UnplannedEventsRaw } from '~/shared/types'

export function decompressJson(data: { columns: string[], values: any[][] }) {
  const { columns, values } = data
  return values.map(v =>
    Object.fromEntries(v.map((value, i) => [columns[i], value])))
}
