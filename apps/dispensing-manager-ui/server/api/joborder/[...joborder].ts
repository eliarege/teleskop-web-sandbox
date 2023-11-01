import { createRouter, defineEventHandler, useBase } from 'h3'
import type { Knex } from 'knex'
import { knex } from '~/server/connectionPool'
import { filtersToKnex } from '~/shared/functions'

const router = createRouter()
export default useBase('/api/joborder', router.handler)

router.get('/joborders', defineEventHandler(async (event) => {
  try {
    const orders = await knex('DYBFBATCHPLAN as b')
      .select({
        joborder: 'b.JOBORDER',
        correctionNo: 'b.CORRECTIONNUMBER',
        plannedMachineName: 'm.MACHINENAME',
        plannedMachineID: 'b.PLANNEDMACHINE',
        programList: 'b.PROGRAMNOLIST',
        plannedStartTime: 'b.PLANNEDSTARTTIME',
      })
      .join('dbo.DYTFMACHINES as m', 'b.PLANNEDMACHINE', 'm.MACHINEID')
      .orderBy('b.PLANNEDSTARTTIME', 'desc')
    return orders
  } catch (e) {
    return e
  }
}))

router.post('/filtered-joborders', defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const ordersKnex: any = knex('DYBFBATCHPLAN as b')
      .join('dbo.DYTFMACHINES as m', 'b.PLANNEDMACHINE', 'm.MACHINEID')
      .orderBy('b.JOBORDER', 'b.CORRECTIONNUMBER')
      .select({
        joborder: 'b.JOBORDER',
        correctionNo: 'b.CORRECTIONNUMBER',
        plannedMachineName: 'm.MACHINENAME',
        plannedMachineID: 'b.PLANNEDMACHINE',
        programList: 'b.PROGRAMNOLIST',
        plannedStartTime: 'b.PLANNEDSTARTTIME',
      })
    if (body.length > 0)
      return await filtersToKnex(body, ordersKnex)
    else
      return await ordersKnex
    // .where((builder) => {
    //   body.forEach((filter) => {
    //     const attName = filter.optionValue ? filter.optionValue : filter.field
    //     const DBName = returnDBCol(attName)
    //     if (filter.isOrderFilter) {
    //       console.log('Ordering is an optional for backend. Its not implemented right now.')
    //     } else if (filter.filterType === 'select' || filter.filterType === 'multiselect') {
    //       builder.andWhere((innerBuilder) => {
    //         filter.value.option.forEach((opt) => {
    //           innerBuilder.orWhere(DBName, '=', opt[attName])
    //         })
    //       })
    //     } else if (filter.filterType === 'comparison') {
    //       if (filter.value.max && filter.value.min) {
    //         builder.andWhere(DBName, '<', filter.value.max)
    //         builder.andWhere(DBName, '>=', filter.value.min)
    //       } else if (filter.value.number && filter.value.operator) {
    //         builder.andWhere(DBName, filter.value.operator, filter.value.number)
    //       }
    //     } else if (filter.filterType === 'date') {
    //       builder.andWhere(DBName, '<', filter.value.to)
    //       builder.andWhere(DBName, '>=', filter.value.from)
    //     } else if (filter.filterType === 'boolean') {
    //       builder.andWhere(DBName, filter.value.option[0])
    //     }
    //   })
    // })

    // ---------------------------------------------------------------------------------------
    // .where((builder) => {
    //   if (joborder)
    //     builder.where('b.JOBORDER', joborder)
    //   if (machineid)
    //     builder.where('b.PLANNEDMACHINE', '=', Number(machineid))
    //   if (startdate && enddate)
    //     builder.where('b.PLANNEDSTARTTIME', '<=', enddate).andWhere('b.PLANNEDSTARTTIME', '>=', startdate)
    // })
    return result
  } catch (e) {
    return e
  }
}))

router.get('/filterable-table-joborders', defineEventHandler(async (event) => {
  try {
    const { joborder, machineid, startdate, enddate } = getBody(event)
    const orders = await knex('DYBFBATCHPLAN as b')
      .select({
        joborder: 'b.JOBORDER',
        correctionNo: 'b.CORRECTIONNUMBER',
        plannedMachineName: 'm.MACHINENAME',
        plannedMachineID: 'b.PLANNEDMACHINE',
        programList: 'b.PROGRAMNOLIST',
        plannedStartTime: 'b.PLANNEDSTARTTIME',
      })
      .join('dbo.DYTFMACHINES as m', 'b.PLANNEDMACHINE', 'm.MACHINEID')
      .orderBy('b.JOBORDER', 'b.CORRECTIONNUMBER')
      .where((builder) => {
        if (joborder)
          builder.where('b.JOBORDER', joborder)
        if (machineid)
          builder.where('b.PLANNEDMACHINE', '=', Number(machineid))
        if (startdate && enddate)
          builder.where('b.PLANNEDSTARTTIME', '<=', enddate).andWhere('b.PLANNEDSTARTTIME', '>=', startdate)
      })
    return orders
  } catch (e) {
    return e
  }
}))
