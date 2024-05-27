import type { Column } from './types'

export const EOL = {
  windows: '\r\n',
  linux: '\n',
}
export const breakpoints = {
  laptop: 768,
}

export const columns: Array<Column> = [
  { name: 'name', label: 'Name', field: 'name', filterable: true, filterType: 'select', selectionOptions: ['Choose 1', 'Choose 2', 'Choose 3'] },
  { name: 'calories', label: 'Calories', field: 'calories', filterable: true, filterType: 'multiselect', selectionOptions: ['Choose 1', 'Choose 2', 'Choose 3'] },
  { name: 'fat', label: 'Fat (g)', field: 'fat', filterable: true, filterType: 'comparison' },
  { name: 'carbs', label: 'Carbs (g)', field: 'carbs', filterable: true, filterType: 'date' },
  { name: 'protein', label: 'Protein (g)', field: 'protein', filterable: true, filterType: 'boolean' },
  { name: 'sodium', label: 'Sodium (mg)', field: 'sodium', filterable: true, filterType: 'boolean' },
]
export const colors = {
  violet: 'rgb(70, 56, 141)',
  blue: '',
  black: 'rgb(0, 0, 0)',
  tableGray: 'rgb(0, 0, 0, 0.1)',
  status0: '',
  status1: '#ffff00',
  status2: '#0000ff',
  status3: '#008000',
  status4: '#808080',
  status8: '#ff0000',
  status10: '#ffa500',
}

export enum StatusCodes {
  newRequest = 0,
  inDispenser = 1,
  inProcess = 2,
  requestCompleted = 3,
  priorityChanged = 4,
  canceled = 8,
  dispenserChanged = 10,
}
