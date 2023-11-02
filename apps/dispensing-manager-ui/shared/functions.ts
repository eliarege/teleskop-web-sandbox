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

/** Returns a database name of the spesific attribute */

export async function filtersToKnex(filters: Array<FilterSlot>, attributes: any, knexInstance: Knex.QueryBuilder) {
  const resultQuery: Knex.QueryBuilder = await knexInstance
    .where((builder) => {
      filters.forEach((filter) => {
        const attName = filter.optionValue ? filter.optionValue : filter.field
        const DBName = attributes[attName]
        console.log(attributes)
        console.log(DBName)
        console.log(attName)

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
