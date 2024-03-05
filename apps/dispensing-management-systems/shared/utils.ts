import { dmsDB } from '~/server/connectionPool'

export function cellStyle(col: any, row: any, pageIndex: number, isSelected: boolean, isDarkMode: boolean, colors: any) {
  let style = 'background-color: '
  if (col.field === 'status') {
    style += colors.jobOrderStatusColors[row.status] || '#FFFFFF'
    style += '; color: white; font-weight: bolder; font-size: medium'
  } else if (isDarkMode) {
    if (isSelected) {
      style += colors.selectedRowDark
    } else if (pageIndex % 2 === 0) {
      style += colors.darkJobOrderCellEven
    } else {
      style += colors.darkJobOrderCellOdd
    }
  } else {
    if (isSelected) {
      style += colors.selectedRowLight
    } else if (pageIndex % 2 === 0) {
      style += colors.lightJobOrderCellEven
    } else {
      style += colors.lightJobOrderCellOdd
    }
  }
  return style
}
export async function batchInsert(data: any[], batchSize: number, tableName: string, colName: string) {
  const totalRows = data.length
  const numBatches = Math.ceil(totalRows / batchSize)
  await dmsDB.transaction(async (trx) => {
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize
      const end = Math.min((i + 1) * batchSize, totalRows)
      const batch = data.slice(start, end)

      // Generate the SQL query for batch insertion with ON CONFLICT DO UPDATE
      const insertQuery = trx(tableName)
        .insert(batch)
        .toQuery()

      const conflictUpdateFields = Object.keys(batch[0])
        .map(key => `"${key}" = EXCLUDED."${key}"`) // Map each field to "field = EXCLUDED.field"
        .join(', ')

      const onConflictUpdateQuery = `${insertQuery} ON CONFLICT (${colName}) DO UPDATE SET ${conflictUpdateFields}`

      // Execute the query
      await trx.raw(onConflictUpdateQuery)
    }
  })
}
const ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
export default ipformat
