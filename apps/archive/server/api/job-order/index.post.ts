import { filtersToKnex } from '@teleskop/utils'
import { db } from '~/server/database'

const config = useRuntimeConfig()

const selectParameters = {
  batchStatus: db.raw(/* sql */`\
    CAST(CASE
      WHEN B.CANCELTIME IS NULL AND B.ENDTIME IS NULL
      THEN 1
      ELSE 0 END AS BIT)`),
  batchKey: 'B.BATCHKEY',
  batchReference: 'B.BATCHREFERENCE',
  machineId: 'B.MACHINEID',
  machineName: 'B.MACHINECODE',
  jobOrder: 'B.JOBORDER',
  startTime: db.raw(`DATEADD(MINUTE, ${config.teleskopTimezoneOffset} , B.STARTTIME)`),
  endTime: db.raw(`DATEADD(MINUTE, ${config.teleskopTimezoneOffset} , B.ENDTIME)`),
  cancelTime: db.raw(`DATEADD(MINUTE, ${config.teleskopTimezoneOffset} , B.CANCELTIME)`),
  theoreticalProgramNoList: 'B.PROGRAMNOLIST',
}
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const knexInstance: any = db('BADATA as B')
  let programFilter
  let filters

  if (body.filters && body.filters?.length > 0) {
    const programFilterIndex = body.filters.findIndex((flt: any) => flt.field === 'theoreticalProgramNoList')
    if (programFilterIndex !== -1) {
      filters = body.filters.filter((flt: any) => flt.field !== 'theoreticalProgramNoList')
      programFilter = body.filters[programFilterIndex]
    } else {
      filters = body.filters
    }
    filtersToKnex(filters, selectParameters, knexInstance)
  }

  const { count } = (await knexInstance.clone().count('* as count').first())

  knexInstance.select(selectParameters)

  if (programFilter) {
    knexInstance.andWhere((builder: any) => {
      const DBName = 'B.PROGRAMNOLIST' // selectParameters[programFilter.field]
      programFilter.value.option.forEach((opt: number) => {
        builder.andWhere((innerBuilder: any) => {
          innerBuilder.orWhere(DBName, '=', `${opt}`)
          innerBuilder.orWhere(DBName, 'like', `%,${opt}%`)
          innerBuilder.orWhere(DBName, 'like', `%${opt},%`)
        })
      })
    })
  }

  if (body.pagination) {
    if (body.pagination.sortBy)
      knexInstance.orderBy(selectParameters[body.pagination.sortBy], body.pagination.descending ? 'desc' : 'asc')
    else
      knexInstance.orderBy('B.BATCHKEY', 'desc')
    if (body.pagination.page && body.pagination.rowsPerPage) {
      const offset = (body.pagination.page - 1) * body.pagination.rowsPerPage
      knexInstance.limit(body.pagination.rowsPerPage).offset(offset)
    }
  }
  const rows = await knexInstance
  for (const row of rows) {
    const programNoList = (await db('BAACTUALPRGSTEPS')
      .select('PRGNO')
      .where('BATCHKEY', Number(row.batchKey))
      .orderBy('STEPNO', 'asc'))
      .map(el => el.PRGNO)
    row.theoreticalProgramNoList = row.theoreticalProgramNoList.includes(',') ? row.theoreticalProgramNoList.split(',').map((p: string) => Number(p)) : [Number(row.theoreticalProgramNoList)]
    row.actualProgramNoList = []
    programNoList.forEach((programNo: number, index) => {
      if (index === 0 || programNo !== programNoList[index - 1])
        row.actualProgramNoList.push(programNo)
    })
  }
  return { rows, count }
})
