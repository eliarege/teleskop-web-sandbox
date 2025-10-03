import type { ValueOf } from '@teleskop/utils'

export const ParameterType = {
  Number: 0,
  Select: 1,
  Checkbox: 2,
  SelectAdditive: 3,
} as const

export const AdditiveType = {
  Chemical: 0,
  Dye: 1,
} as const

export const CommandType = {
  AutoChem: 100,
  ManChem: 101,
  AutoDye: 200,
  ManDye: 201,
  ChemTankTransfer: 300,
  PaintTankTransfer: 400,
  ReserveTankTransfer: 500,
  PHControl: 600,
  TakeSample: 700,
  SaltRequest: 800,
  GenericMaterial1: 810,
  GenericMaterial2: 820,
  ManualMeasurement: 1000,
} as const
export type TCommandType = ValueOf<typeof CommandType>
