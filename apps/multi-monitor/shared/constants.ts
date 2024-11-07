type Values<T> = T[keyof T]

export const MachineSort = {
  ById: 1,
  ByActive: 2,
  ByIdle: 3,
  ByGroup: 4,
  Alarms: 5,
} as const

export type MachineSortValue = Values<typeof MachineSort>
