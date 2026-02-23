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
  startTime: db.raw(`DATEADD(MINUTE, ?, B.STARTTIME)`, [config.teleskopTimezoneOffset]),
  endTime: db.raw(`DATEADD(MINUTE, ?, B.ENDTIME)`, [config.teleskopTimezoneOffset]),
  cancelTime: db.raw(`DATEADD(MINUTE, ?, B.CANCELTIME)`, [config.teleskopTimezoneOffset]),
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
    const actualSteps = await db('BAACTUALPRGSTEPS as A')
      .select('A.PRGNO', 'M.NAME')
      .join('BADATA as BD', 'BD.BATCHKEY', 'A.BATCHKEY')
      .join('BAMASTERPRGHEADER as M', function () {
        this.on('M.MACHINEID', '=', 'BD.MACHINEID')
          .andOn('M.PROGNO', '=', 'A.PRGNO')
      })
      .where('A.BATCHKEY', Number(row.batchKey))
      .orderBy('A.STEPNO', 'asc')

    row.theoreticalProgramNoList = row.theoreticalProgramNoList.includes(',')
      ? row.theoreticalProgramNoList.split(',').map((p: string) => Number(p))
      : [Number(row.theoreticalProgramNoList)]

    const theoreticalNames = await db('BAMASTERPRGHEADER')
      .select('PROGNO', 'NAME')
      .where('MACHINEID', row.machineId)
      .whereIn('PROGNO', row.theoreticalProgramNoList)

    const theoreticalNameMap = new Map(theoreticalNames.map((t: any) => [t.PROGNO, t.NAME]))
    row.theoreticalProgramNameList = row.theoreticalProgramNoList.map((p: number) => theoreticalNameMap.get(p) ?? null)

    row.actualProgramNoList = []
    row.actualProgramNameList = []
    actualSteps.forEach((step: any, index: number) => {
      if (index === 0 || step.PRGNO !== actualSteps[index - 1].PRGNO) {
        row.actualProgramNoList.push(step.PRGNO)
        row.actualProgramNameList.push(step.NAME)
      }
    })
  }
  return { rows, count }
})
