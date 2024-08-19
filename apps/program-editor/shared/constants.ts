export const ProgramStateColors = {
  EXISTS_ONLY_ON_CONTROLLER: '#bebebe',
  EXISTS_ONLY_ON_DATABASE: '#00ff00',
  CHANGED_ON_TELESKOP: '#0000ff',
  CHANGED_ON_MACHINE: '#ff00ff',
  NO_CHANGES: '#080808',
  NO_CHANGES_DARK: '#141414',
} as const

export enum ProgramStatus {
  EXISTS_ONLY_ON_CONTROLLER = 0,
  EXISTS_ONLY_ON_DATABASE = 1,
  EXISTS_ON_BOTH = 2,
}

export enum CommandType {
  MAIN = 0,
  PARALLEL = 3,
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

export const CommandIconMapping: Record<string, { icon: string, label?: string, color?: string }> = {
  'AK_Bosalt.gif': { icon: 'game-icons:water-tank', label: 'AK_Bosalt' },
  'Kimyasal_Iste.gif': { icon: 'carbon:chemistry', label: 'Kimyasal_Iste', color: '#00CC00' },
  'KK_AK_Transfer.gif': { icon: 'material-symbols:colors', label: 'KK_AK_Transfer', color: '#ff00ff' },
  'BK_AK_Dozaj.gif': { icon: 'material-symbols:colors', label: 'BK_AK_Dozaj', color: '#0000ff' },
  'BK_AK_Transfer.gif': { icon: 'game-icons:chemical-tank', label: 'BK_AK_Transfer', color: '#ff00ff' },

}
