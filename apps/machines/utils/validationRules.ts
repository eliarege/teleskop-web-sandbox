export const notEmptyRule = val => (val && val.length > 0) || 'This field is required'
export const selectionRule = val => (val !== null && val !== undefined && val !== '') || 'Please make a selection'
export const numberRule = val => (!Number.isNaN(val) && val.length > 0) || 'This field must be a number'
