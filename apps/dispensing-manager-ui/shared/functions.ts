import type { Knex } from 'knex'
import { Notify } from 'quasar'
import type { FilterSlot } from './types'
import { colors } from './constants'

export async function navigateToPage(page: string) {
  await navigateTo(`/${page}`)
}

export function textAlignOverride(pos: string) {
  if (pos === 'center')
    return 'text-override-center'
  if (pos === 'left')
    return 'text-override-left'
  if (pos === 'right')
    return 'text-override-right'
}
/**
 * rowBGColorHandler function sets background color to related color in status columns. Hardcoded numbers (0, 1, 2, 3, 4, 8, 10) represent the current situation of the process.
 * @param row row in table
 * @returns style of the status column for each row respectively
 */
export function cellRGBColorHandler(val) {
  let temp = 'background-color: '
  if (val === 0) {
    temp += 'white; text-color: black;'
  } else {
    if (val === 1)
      temp += colors.status1
    if (val === 2)
      temp += colors.status2
    if (val === 4)
      temp += colors.status4
    if (val === 10)
      temp += colors.status10
    if (val === 3)
      temp += colors.status3
    if (val === 8)
      temp += colors.status8
    temp += '; color: white;'
  }
  temp += 'width: 10rem; border-color: white; border-width: bold; font-weight: bolder; font-size: medium;'
  return temp
}
/** Returns a database name of the spesific attribute */
// Knex should be the first parameter and make function name operateFiltersOnKnexQuery or smt better
/** @deprecated */
export async function filtersToKnex(filters: Array<FilterSlot>, attributes: any, knexInstance: Knex.QueryBuilder) {
  // TODO: knexInstance içine bak belki select parameters kenx objenin içerisinden alınıyordur
  const resultQuery: Knex.QueryBuilder = await knexInstance
    .where((builder) => {
      filters.forEach((filter) => {
        const attName = filter.optionValue ? filter.optionValue : filter.field
        const DBName = attributes[attName]

        if (filter.isOrderFilter) {
          // Ordering is an optional for backend. Its not implemented right now.
        } else if (filter.filterType === 'select' || filter.filterType === 'multiselect') {
          builder.andWhere((innerBuilder) => {
            filter.value.option.forEach((opt) => {
              innerBuilder.orWhere(DBName, '=', opt[attName])
            })
          })
        } else if (filter.filterType === 'comparison') {
          if (filter.value.max && filter.value.min) {
            builder.andWhere(DBName, '<', filter.value.max)
            builder.andWhere(DBName, '>=', filter.value.min)
          } else if (filter.value.number && filter.value.operator) {
            builder.andWhere(DBName, filter.value.operator, filter.value.number)
          }
        } else if (filter.filterType === 'date') {
          builder.andWhere(DBName, '<', filter.value.to)
          builder.andWhere(DBName, '>=', filter.value.from)
        } else if (filter.filterType === 'boolean') {
          builder.andWhere(DBName, filter.value.option[0])
        } else if (filter.filterType === 'includes') {
          builder.andWhere(DBName, 'like', `%${filter.value}%`)
        } else if (filter.filterType === 'equals') {
          builder.andWhere(DBName, `${filter.value}`)
        }
      })
    })

  return resultQuery
}

// else if (filter.filterType === 'boolean') {
//   const value: boolean = filter.value.option[0]
//   knexInstance.andWhere(name, '=', value)
// } else if (filter.filterType === 'date') {
//   knexInstance.andWhere(name, '<', filter.value.to)
//   knexInstance.andWhere(name, '>=', filter.value.from)
// } else if (filter.filterType === 'comparison') {
//   if (filter.value.operator && filter.value.number)
//     knexInstance.andWhere(name, filter.value.operator, filter.value.number)
//   if (filter.value.min && filter.value.max) {
//     knexInstance.andWhere(name, '<', filter.value.max)
//     knexInstance.andWhere(name, '>=', filter.value.min)
//   }
// }

export function notification(isSuccess: any, message: string) {
  Notify.create({
    message,
    type: isSuccess ? 'positive' : 'warning',
    position: 'top',
  })
}

export function removeAnyNonNumerical(param: string | null): number | null {
  if (param === null)
    return null
  const numericOnly = param.toString().replace(/\D/g, '')
  return numericOnly ? Number.parseInt(numericOnly, 10) : null
}
