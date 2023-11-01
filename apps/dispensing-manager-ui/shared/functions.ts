import type { Knex } from 'knex'
import type { FilterSlot } from './types'

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

const wordbank = [
  { word: 'joborder', mean: 'b.JOBORDER' },
  { word: '', mean: '' },
  { word: '', mean: '' },
  { word: '', mean: '' },
  { word: '', mean: '' },
  { word: '', mean: '' },
  { word: '', mean: '' },
  { word: '', mean: '' },
  { word: '', mean: '' },
  { word: '', mean: '' },
]

/** Returns a database name of the spesific attribute */
function returnDBCol(param: string) {
  if (param === 'machineid')
    return 'b.PLANNEDMACHINE'
  if (param === 'correctionNo')
    return 'b.CORRECTIONNUMBER'
  if (param === 'plannedStartTime')
    return 'b.PLANNEDSTARTTIME'
}

export async function filtersToKnex(filters: Array<FilterSlot>, knexInstance: Knex.QueryBuilder) {
  console.log(knexInstance)
  const resultQuery: Knex.QueryBuilder = await knexInstance
    .where((builder) => {
      filters.forEach((filter) => {
        const attName = filter.optionValue ? filter.optionValue : filter.field
        const DBName = returnDBCol(attName)
        if (filter.isOrderFilter) {
          console.log('Ordering is an optional for backend. Its not implemented right now.')
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
