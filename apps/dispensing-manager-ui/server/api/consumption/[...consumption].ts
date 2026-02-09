import { createRouter, useBase } from 'h3'
import { filtersToKnex } from '@teleskop/utils'
import type { FilterableTableFilter } from '@teleskop/nuxt-base'
import type { Knex } from 'knex'
import { knex } from '~/server/connectionPool'

const router = createRouter()
const config = useRuntimeConfig()

export default useBase('/api/consumption', router.handler)

router.get('/theoretical', defineAuthEventHandler(async (event) => {
  const { jobOrder, correctionNo } = getQuery(event)

  const query = await knex
    .select({
      processNo: 'B.PROGRAMNO',
      machineName: 'M.MACHINENAME',
      tankNo: 'A.DISPENSERID',
      processIndex: 'B.RECIPEINDEX',
      mainStep: 'A.MAINSTEP',
      parallelStep: 'A.PARALLELSTEP',
      materialCode: 'A.CHEMCODE',
      materialName: 'C.MATERIALNAME',
      recipeAmount: 'A.AMOUNT',
      actualAmount: 'A.REALAMOUNT',
      status: 'A.STATUS',
      requestTime: knex.raw(`DATEADD(MINUTE, ?, B.REQUESTTIME)`, [config.teleskopTimezoneOffset]),
      completedTime: knex.raw(`DATEADD(MINUTE, ?, B.COMPLETEDTIME)`, [config.teleskopTimezoneOffset]),
      machineId: 'B.MACHINEID',
      interval: knex.raw('DATEDIFF(minute, B.REQUESTTIME, B.COMPLETEDTIME)'),
      otoMan: 'B.AUTO',
    })
    .from('DYTFREQMATERIALS as A')
    .join('DYTFCHEMREQUESTS as B', 'A.REQNUMBER', '=', 'B.REQNUMBER')
    .join('DYTFMACHINES as M', 'B.MACHINEID', 'M.MACHINEID')
    .join('DYTFMATERIAL as C', 'A.CHEMCODE', '=', 'C.MATERIALCODE')
    .where('B.BATCHNO', jobOrder)
    .andWhere('B.BATCHCORRECTIONNO', correctionNo)
    .orderBy(['B.REQUESTTIME', 'A.PARALLELSTEP'])
  return query
}))

router.get('/manual', defineAuthEventHandler(async (event) => {
  const { jobOrder, correctionNo } = getQuery(event)

  const query = await knex('DYTFDUSTMATERIALSREQ as A')
    .select({
      jobOrder: 'A.BATCHNO',
      correctionNo: 'A.CORRECTIONNO',
      weighingNumber: 'A.QUEUENO',
      recipeType: 'A.RECIPETYPE',
      materialCode: 'B.CODE',
      materialName: 'C.MATERIALNAME',
      actualAmount: 'B.AMOUNT',
      status: 'A.STATUS',
      requestTime: knex.raw(`DATEADD(MINUTE, ?, A.REQUESTTIME)`, [config.teleskopTimezoneOffset]),
    })
    .join('DYTFDUSTMATERIALS as B', 'A.REQNUMBER', 'B.REQNUMBER')
    .join('DYTFMATERIAL as C', 'B.CODE', 'C.MATERIALCODE')
    .where('A.BATCHNO', jobOrder)
    .andWhere('A.CORRECTIONNO', correctionNo)
  return query
}))

router.post('/consumptions', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const { pagination, filters } = body as {
    pagination?: { page: number, rowsPerPage: number }
    filters?: FilterableTableFilter[]
  }

  const selectParametersConsumption: Record<string, string | Knex.Raw> = {
    consumptionNo: 'd.CONSUMPTIONNO',
    recordDate: knex.raw(`DATEADD(MINUTE, ?, d.RECORDDATE)`, [config.teleskopTimezoneOffset]),
    amount: 'd.AMOUNT',
    unit: 'd.UNIT',
    manuel: knex.raw('IIF(d.ISMANUEL = 0, 0, 1)'),
    automatic: knex.raw('IIF(d.ISMANUEL = 1, 0, 1)'),
    addition: 'd.ADDITION',
    correction: 'd.CORRECTION',
    system: 'd.SYSTEM',
    dispenserId: 'm.DISPENSERID',
    dispenserName: 'm.NAME',
    isTransferred: 'd.ISTRANSFERRED',
    materialCode: 'd.MATERIALCODE',
    jobOrderCode: 'd.JOBORDERCODE',
    consumptionCode: 'd.CONSUMPTIONCODE',
    water: 'd.WATER',
    recipeAmount: 'd.RECIPEAMOUNT',
    programNo: 'd.PROGRAMNO',
    programOrder: 'd.PROGRAMORDER',
    programReqOrder: 'd.PROGRAMREQORDER',
    machineId: 'c.MACHINEID',
    machineName: 'c.MACHINENAME',
    isErpTransferred: 'd.ISERPTRANSFERRED',
    calculatedConsumption: 'd.CALCULATEDCONSUMPTION',
    recipeNo: 'd.RECIPENO',
    totalTargetAmount: 'd.TOTALTARGETAMOUNT',
  }

  const dataQuery = knex('DYTACONSUMPTION as d')
    .select(selectParametersConsumption)
    .leftJoin('DYTFDISPENSERSETTINGS as m', 'd.DISPENSERID', 'm.DISPENSERID')
    .leftJoin('DYTFMACHINES as c', 'd.MACHINEID', 'c.MACHINEID')
    .where('d.DISPENSERID', '!=', -1)
    .orderBy('d.RECORDDATE', 'desc')

  if (filters && filters.length > 0) {
    filters.forEach((filter) => {
      if (filter.filterType === 'multiselect') {
        const validOptions = filter.value.option?.filter((opt: { value: string }) => selectParametersConsumption[opt.value])
        if (!validOptions || validOptions.length === 0)
          return
        dataQuery.andWhere((builder) => {
          validOptions.forEach((opt: { value: string }) => {
            builder.orWhere(selectParametersConsumption[opt.value] as Knex.Raw, '=', 1)
          })
        })
      } else {
        filtersToKnex([filter], selectParametersConsumption, dataQuery)
      }
    })
  }

  const countQuery = dataQuery.clone().clearSelect().clearOrder().count('* as count')
  const [{ count }] = await countQuery

  if (pagination) {
    const offset = (pagination.page - 1) * pagination.rowsPerPage
    dataQuery.limit(pagination.rowsPerPage).offset(offset)
  }

  const rows = await dataQuery

  return {
    rows,
    count,
  }
}))
