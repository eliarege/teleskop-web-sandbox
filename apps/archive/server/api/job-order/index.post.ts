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
  let actualProgramFilter
  let filters

  if (body.filters && body.filters?.length > 0) {
    const programFilterIndex = body.filters.findIndex((flt: any) => flt.field === 'theoreticalProgramNoList')
    const actualProgramFilterIndex = body.filters.findIndex((flt: any) => flt.field === 'actualProgramNoList')
    filters = body.filters.filter((flt: any) => flt.field !== 'theoreticalProgramNoList' && flt.field !== 'actualProgramNoList')
    if (programFilterIndex !== -1)
      programFilter = body.filters[programFilterIndex]
    if (actualProgramFilterIndex !== -1)
      actualProgramFilter = body.filters[actualProgramFilterIndex]
    filtersToKnex(filters, selectParameters, knexInstance)
  }

  if (programFilter) {
    const opts: number[] = programFilter.value.option
    knexInstance.andWhere((builder: any) => {
      opts.forEach((opt: number) => {
        builder.orWhere((inner: any) => {
          inner.where('B.PROGRAMNOLIST', '=', `${opt}`)
            .orWhere('B.PROGRAMNOLIST', 'like', `${opt},%`) // first in list
            .orWhere('B.PROGRAMNOLIST', 'like', `%,${opt}`) // last in list
            .orWhere('B.PROGRAMNOLIST', 'like', `%,${opt},%`) // middle of list
        })
      })
    })
  }

  if (actualProgramFilter) {
    const actualOpts: number[] = actualProgramFilter.value.option
    knexInstance.whereIn('B.BATCHKEY', function (this: any) {
      this.select('BATCHKEY').from('BAACTUALPRGSTEPS').whereIn('PRGNO', actualOpts)
    })
  }

  const { count } = (await knexInstance.clone().count('* as count').first())

  // Build match-count expressions so rows matching more selected programs rank higher.
  const extraSelectColumns: Record<string, any> = {}

  if (programFilter && programFilter.value.option.length > 1) {
    const bindings: string[] = []
    const caseParts = programFilter.value.option.map((opt: number) => {
      bindings.push(`${opt}`, `${opt},%`, `%,${opt}`, `%,${opt},%`)
      return 'CASE WHEN B.PROGRAMNOLIST = ? OR B.PROGRAMNOLIST LIKE ? OR B.PROGRAMNOLIST LIKE ? OR B.PROGRAMNOLIST LIKE ? THEN 1 ELSE 0 END'
    })
    extraSelectColumns.theoMatchCount = db.raw(`(${caseParts.join(' + ')})`, bindings)
  }

  if (actualProgramFilter && actualProgramFilter.value.option.length > 1) {
    const actualOpts: number[] = actualProgramFilter.value.option
    const bindings: number[] = []
    const caseParts = actualOpts.map((opt: number) => {
      bindings.push(opt)
      return 'CASE WHEN EXISTS (SELECT 1 FROM BAACTUALPRGSTEPS WHERE BATCHKEY = B.BATCHKEY AND PRGNO = ?) THEN 1 ELSE 0 END'
    })
    extraSelectColumns.actualMatchCount = db.raw(`(${caseParts.join(' + ')})`, bindings)
  }

  if (Object.keys(extraSelectColumns).length > 0) {
    knexInstance.select({ ...selectParameters, ...extraSelectColumns })
  } else {
    knexInstance.select(selectParameters)
  }

  if (body.pagination) {
    if (programFilter && programFilter.value.option.length > 1)
      knexInstance.orderBy('theoMatchCount', 'desc')
    if (actualProgramFilter && actualProgramFilter.value.option.length > 1)
      knexInstance.orderBy('actualMatchCount', 'desc')

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

    delete row.matchCount
    delete row.theoMatchCount
    delete row.actualMatchCount
  }
  return { rows, count }
})
