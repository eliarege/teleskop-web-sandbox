import type { ValueOf } from '@teleskop/utils'

export const ProjectLocale = {
  Turkish: 0,
  English: 1,
  Russian: 2,
  Persian: 3,
  PersianLatin: 4,
  BrazilianPortuguese: 5,
  Spanish: 6,
  Arabic: 7,
  ChineseSimplified: 8,
  ChineseTraditional: 9,
  Greek: 10,
  Malay: 11,
  UzbekLatin: 12,
  Italian: 13,
  Vietnamese: 14,
  SerbianLatin: 15,
  Korean: 16,
  German: 17,
  French: 18,
} as const

export type ProjectLocale = ValueOf<typeof ProjectLocale>

export const MachineConstantType = {
  NUMBER: 1,
  LIST: 2,
  BIT: 3,
}

export type MachineConstantType = ValueOf<typeof MachineConstantType>

export const CommandParameterType = {
  NUMBER: 0,
  SELECT: 1,
  CHECKBOX: 2,
  SELECT_ADDITIVE: 3,
} as const

export type CommandParameterType = ValueOf<typeof CommandParameterType>

export const BatchParameterType = {
  FabricWeight: 0,
  MTFlotteRatio: 1,
  PartCount: 2,
  PartyNumber: 3,
  AccompanyNumber: 4,
  ClothLength: 5,
  Customer: 6,
  CustomerOrder: 7,
  FabricType: 8,
} as const

export type BatchParameterType = ValueOf<typeof BatchParameterType>

export const MachineGroupType = {
  FabricHT: 0,
  FabricOF: 1,
  Bobbin: 2,
  Sample: 3,
  Flock: 4,
  Washing: 5,
  WashingDyeing: 6,
  Drying: 7,
  Other: 9,
} as const

export type MachineGroupType = ValueOf<typeof MachineGroupType>

