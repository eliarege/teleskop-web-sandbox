import { filtersToKnex } from '@teleskop/utils'
import { db } from '~/server/database'

const config = useRuntimeConfig()

const selectParameters = {
  batchKey: 'B.BATCHKEY',
  batchReference: 'B.BATCHREFERENCE',
  machineId: 'B.MACHINEID',
  machineName: 'B.MACHINECODE',
  joborder: 'B.JOBORDER',
  startTime: db.raw(`DATEADD(MINUTE, ${config.teleskopTimezoneOffset} , B.STARTTIME)`),
  endTime: db.raw(`DATEADD(MINUTE, ${config.teleskopTimezoneOffset} , B.ENDTIME)`),
  cancelTime: db.raw(`DATEADD(MINUTE, ${config.teleskopTimezoneOffset} , B.CANCELTIME)`),
  theoreticalProgramNoList: 'B.PROGRAMNOLIST',
}
export default defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const knexInstance: any = db('BADATA as B')

  if (body.filters && body.filters?.length > 0) {
    filtersToKnex(body.filters, selectParameters, knexInstance)
  }

  const { count } = (await knexInstance.clone().count('* as count').first())

  knexInstance.select(selectParameters)

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
    const programNoList = (await db('BAACTUALPRGSTEPS').select('PRGNO').where('BATCHKEY', Number(row.batchKey)).orderBy('STEPNO', 'asc')).map(el => el.PRGNO)
    row.theoreticalProgramNoList = row.theoreticalProgramNoList.includes(',') ? row.theoreticalProgramNoList.split(',') : [row.theoreticalProgramNoList]
    row.theoreticalProgramNoList.forEach(e => e = Number(e))
    row.actualProgramNoList = []
    programNoList.forEach((programNo: number, index) => {
      if (index === 0 || programNo !== programNoList[index - 1])
        row.actualProgramNoList.push(programNo)
    })
  }

  return { rows, count }
})
