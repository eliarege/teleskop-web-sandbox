export const ProgramStateColors = {
  EXISTS_ONLY_ON_CONTROLLER: '#bebebe',
  EXISTS_ONLY_ON_DATABASE: '#009900',
  CHANGED_ON_TELESKOP: '#0000ff',
  CHANGED_ON_MACHINE: '#ff00ff',
  NO_CHANGES: '#080808',

  EXISTS_ONLY_ON_CONTROLLER_DARK: 'd0d0d0',
  EXISTS_ONLY_ON_DATABASE_DARK: '#32cd32',
  CHANGED_ON_TELESKOP_DARK: '#1e90ff',
  CHANGED_ON_MACHINE_DARK: '#ff00ff',
  NO_CHANGES_DARK: '#f5f5f5',
} as const

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
}

export enum CommandType {
  MAIN = 0,
  PARALLEL = 3,
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

export enum ParameterType {
  NUMBER = 'NUMBER',
  SELECT = 'SELECT',
  MACHINE_FORMULA = 'MACHINE_FORMULA',
  SELECTABLE_FORMULA = 'SELECTABLE_FORMULA',
}

export const commandTypeMaps = [
  { index: 0, ref: [], value: 100, title: 'chemicalRequestCommands' },
  { index: 1, ref: [], value: 101, title: 'manualChemicalRequestCommands' },
  { index: 2, ref: [], value: 200, title: 'paintRequestCommands' },
  { index: 3, ref: [], value: 201, title: 'manualPaintRequestCommands' },
  { index: 4, ref: [], value: 300, title: 'chemicalTankTransferCommands' },
  { index: 5, ref: [], value: 400, title: 'paintTankTransferCommands' },
  { index: 6, ref: [], value: 500, title: 'reserveTankTransferCommands' },
  { index: 7, ref: [], value: 600, title: 'pHControl' },
  { index: 8, ref: [], value: 700, title: 'takeSample' },
  { index: 9, ref: [], value: 800, title: 'saltRequestCommands' },
  { index: 10, ref: [], value: 810, title: 'genericMaterial1Request' },
  { index: 11, ref: [], value: 820, title: 'genericMaterial2Request' },
  { index: 12, ref: [], value: 1000, title: 'manualMeasurementCommands' },
]

// @unocss-include
export const CommandIconMapping: Record<string, { name: string, label?: string, color?: string }> = {
  'AK_Bosalt.gif': { name: 'i-ri-exchange-2-line', label: 'AK_Bosalt', color: '#00CC00' },
  'Kimyasal_Iste.gif': { name: 'i-carbon-chemistry', label: 'Kimyasal_Iste', color: '#00CC00' },
  'KK_AK_Transfer.gif': { name: 'i-ri-exchange-2-line', label: 'KK_AK_Transfer', color: '#228b22' },
  'BK_AK_Dozaj.gif': { name: 'i-icon-park-outline-curve-adjustment', label: 'BK_AK_Dozaj', color: '#e67e22' },
  'BK_AK_Transfer.gif': { name: 'i-ri-exchange-2-line', label: 'BK_AK_Transfer', color: '#ff00ff' },
  'KK_RK_Transfer.gif': { name: 'i-ri-exchange-2-line', label: 'KK_RK_Transfer', color: '#0000ff' },
}
