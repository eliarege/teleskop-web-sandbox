export const PRG_STATE_COLORS = {
  EXISTS_ONLY_ON_CONTROLLER: 'silver',
  EXISTS_ONLY_ON_DATABASE: 'green',
  CHANGED_ON_TELESKOP: 'blue',
  CHANGED_ON_MACHINE: 'fuchsia',
  NO_CHANGES: 'black',
}

export enum ProgramStatus {
  EXISTS_ONLY_ON_CONTROLLER = 0,
  EXISTS_ONLY_ON_DATABASE = 1,
  EXISTS_ON_BOTH = 2,
}
