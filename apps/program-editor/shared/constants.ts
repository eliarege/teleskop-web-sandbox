import type { ValueOf } from '@teleskop/utils'

export enum TeleskopSettingsIds {
  OPTIMIZED_ENABLE = 3,
  OPTIMIZED_LIMIT = 11,
  SELECTED_ICONS = 12,
  INITIAL_TEMPERATURE = 13,
}

export enum ProgramStatus {
  EXISTS_ONLY_ON_CONTROLLER = 0,
  EXISTS_ONLY_ON_DATABASE = 1,
  EXISTS_ON_BOTH = 2,
  CHANGED_ON_TELESKOP = 3,
  CHANGED_ON_MACHINE = 4,
}

export const PROGRAM_STATUS_COLORS = {
  [ProgramStatus.EXISTS_ONLY_ON_CONTROLLER]: { light: '#bebebe', dark: '#a0a0a0' },
  [ProgramStatus.EXISTS_ONLY_ON_DATABASE]: { light: '#009900', dark: '#32cd32' },
  [ProgramStatus.CHANGED_ON_TELESKOP]: { light: '#0000ff', dark: '#1e90ff' },
  [ProgramStatus.CHANGED_ON_MACHINE]: { light: '#ff00ff', dark: '#ff00ff' },
  [ProgramStatus.EXISTS_ON_BOTH]: { light: '#080808', dark: '#f5f5f5' },
} as const

export enum CommandEligibility {
  MAIN_OR_PARALLEL = 0,
  PARALLEL_ONLY = 3,
}

export enum MoveParallel {
  MOVE = 0,
  MOVE_UNTIL_DISABLED = 1,
  STOP = 2,
}

export const IO_TYPE: { [key: string]: string } = {
  '0': 'Analog Input',
  '1': 'Analog Input',
  '2': 'Analog Output',
  '3': 'Digital Input',
  '4': 'Digital Output',
  '5': 'Counter',
  '-1': 'Seçilmemiş',
}

export const ParameterType = {
  NUMBER: 'NUMBER',
  SELECT: 'SELECT',
  CHECKBOX: 'CHECKBOX',
  SELECT_ADDITIVE: 'SELECT_ADDITIVE',
  MACHINE_FORMULA: 'MACHINE_FORMULA',
  SELECTABLE_FORMULA: 'SELECTABLE_FORMULA',
} as const

export const ParameterTypeRaw = {
  NUMBER: 0,
  SELECT: 1,
  CHECKBOX: 2,
  SELECT_ADDITIVE: 3,
} as const

export type ParameterTypeValue = ValueOf<typeof ParameterType>

export enum CommandType {
  AutoChem = 100,
  ManChem = 101,
  AutoDye = 200,
  ManDye = 201,
  ChemTankTransfer = 300,
  PaintTankTransfer = 400,
  ReserveTankTransfer = 500,
  PHControl = 600,
  TakeSample = 700,
  SaltRequest = 800,
  GenericMaterial1 = 810,
  GenericMaterial2 = 820,
  ManualMeasurement = 1000,
}

export const AdditiveType = {
  Chemical: 0,
  Dye: 1,
} as const

export interface CommandTypeMap {
  index: number
  ref: any[]
  value: CommandType
  title: string
  icon: string
  color: string
}

export const commandTypeMaps: CommandTypeMap[] = [
  { index: 0, ref: [], value: CommandType.AutoChem, title: 'chemicalRequest', icon: 'i-carbon-chemistry', color: '#00CC00' },
  { index: 1, ref: [], value: CommandType.ManChem, title: 'manualChemicalRequest', icon: 'i-carbon-chemistry', color: '#E67E22' },
  { index: 2, ref: [], value: CommandType.AutoDye, title: 'paintRequest', icon: 'i-mingcute:paint-line', color: '#FF00FF' },
  { index: 3, ref: [], value: CommandType.ManDye, title: 'manualPaintRequest', icon: 'i-mingcute:paint-line', color: '#E67E22' },
  { index: 4, ref: [], value: CommandType.ChemTankTransfer, title: 'chemicalTankTransfer', icon: 'i-ri-exchange-2-line', color: '#228b22' },
  { index: 5, ref: [], value: CommandType.PaintTankTransfer, title: 'paintTankTransfer', icon: 'i-ri-exchange-2-line', color: '#FF00FF' },
  { index: 6, ref: [], value: CommandType.ReserveTankTransfer, title: 'reserveTankTransfer', icon: 'i-ri-exchange-2-line', color: '#0000FF' },
  { index: 7, ref: [], value: CommandType.PHControl, title: 'pHControl', icon: 'i-material-symbols:water-ph-outline', color: '#0000FF' },
  { index: 8, ref: [], value: CommandType.TakeSample, title: 'takeSample', icon: 'i-ph:eyedropper-sample-fill', color: '#0000FF' },
  { index: 9, ref: [], value: CommandType.SaltRequest, title: 'saltRequest', icon: 'i-tabler:salt', color: '#00CC00' },
  { index: 10, ref: [], value: CommandType.GenericMaterial1, title: 'genericMaterial1Request', icon: 'i-streamline:interface-arrows-data-transfer-vertical-arrow-square-data-internet-transfer-network-vertical', color: '#00CC00' },
  { index: 11, ref: [], value: CommandType.GenericMaterial2, title: 'genericMaterial2Request', icon: 'i-streamline:interface-arrows-data-transfer-vertical-arrow-square-data-internet-transfer-network-vertical', color: '#E67E22' },
  { index: 12, ref: [], value: CommandType.ManualMeasurement, title: 'manualMeasurement', icon: 'i-mdi:hydraulic-oil-level', color: '#1E90FF' },
]

export const ADDITIONAL_PROCESS_CODE_ILAVE = 7
