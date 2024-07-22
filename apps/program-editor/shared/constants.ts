export const PRG_STATE_COLORS = {
  EXISTS_ONLY_ON_CONTROLLER: 'gray',
  EXISTS_ONLY_ON_DATABASE: 'green',
  CHANGED_ON_TELESKOP: 'blue',
  CHANGED_ON_MACHINE: 'fuchsia',
  NO_CHANGES: 'gray-3',
  NO_CHANGES_DARK: 'gray-8',
}

export enum ProgramStatus {
  EXISTS_ONLY_ON_CONTROLLER = 0,
  EXISTS_ONLY_ON_DATABASE = 1,
  EXISTS_ON_BOTH = 2,
}

export const COMMAND_TYPE = {
  MAIN: 0,
  PARALLEL: 3,
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
