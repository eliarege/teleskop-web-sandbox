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
