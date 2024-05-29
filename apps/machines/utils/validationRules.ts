export const notEmptyRule = (val: string) => (val && val.length > 0) || 'This field is required'
export const selectionRule = (val: string) => (val !== null && val !== undefined && val !== '') || 'Please make a selection'
export const numberRule = (val: string) => (!Number.isNaN(val) && val.length > 0) || 'This field must be a number'
