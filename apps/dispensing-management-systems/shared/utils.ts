export function cellStyle(col: any, row: any, pageIndex: number, isDarkMode: boolean, colors: any) {
  let style = 'background-color: '

  if (col.field === 'status') {
    style += colors.jobOrderStatusColors[row.status] || '#FFFFFF'
    style += '; color: white; font-weight: bolder; font-size: medium'
  } else if (isDarkMode) {
    if (pageIndex % 2 === 0) {
      style += colors.darkJobOrderCellEven
    } else {
      style += colors.darkJobOrderCellOdd
    }
  } else {
    if (pageIndex % 2 === 0) {
      style += colors.lightJobOrderCellEven
    } else {
      style += colors.lightJobOrderCellOdd
    }
  }
  return style
}
const ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
export default ipformat
