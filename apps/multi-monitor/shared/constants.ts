type Values<T> = T[keyof T]

export const MachineSort = {
  ById: 1,
  ByActive: 2,
  ByIdle: 3,
  ByGroup: 4,
  ByCustom: 5,
} as const

export const Apps = {
  archive: 'archive',
  multiMonitor: 'multi-monitor',
  planningBoard: 'planning-board',
  programEditor: 'program-editor',
  dispensingManager: 'dispensing-manager',
}
export type MachineSortValue = Values<typeof MachineSort>
