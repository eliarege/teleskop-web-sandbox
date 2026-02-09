import { createRouter, useBase } from 'h3'
import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

const router = createRouter()
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
      requestTime: 'B.REQUESTTIME',
      completedTime: 'B.COMPLETEDTIME',
      machineId: 'B.MACHINEID',
      interval: knex.raw('DATEDIFF(minute, B.REQUESTTIME, B.COMPLETEDTIME)'),
      otoMan: 'B.AUTO',
    },
    )
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
      requestTime: 'A.REQUESTTIME',
    })
    .join('DYTFDUSTMATERIALS as B', 'A.REQNUMBER', 'B.REQNUMBER')
    .join('DYTFMATERIAL as C', 'B.CODE', 'C.MATERIALCODE')
    .where('A.BATCHNO', jobOrder)
    .andWhere('A.CORRECTIONNO', correctionNo)
  return query
}))

const selectParametersConsumption = {
  consumptionNo: 'd.CONSUMPTIONNO',
  recordDate: 'd.RECORDDATE',
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

router.post('/consumptions', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const { pagination, filters } = body

  const dataQuery = knex('DYTACONSUMPTION as d')
    .select(selectParametersConsumption)
    .leftJoin('DYTFDISPENSERSETTINGS as m', 'd.DISPENSERID', 'm.DISPENSERID')
    .leftJoin('DYTFMACHINES as c', 'd.MACHINEID', 'c.MACHINEID')
    .where('d.DISPENSERID', '!=', -1)
    .orderBy('RECORDDATE', 'desc')

  if (filters && filters.length > 0) {
    filters.forEach((filter: any) => {
      if (filter.filterType === 'multiselect') {
        dataQuery.andWhere((builder: any) => {
          filter.value.option?.forEach((opt: any) => {
            builder.orWhere(selectParametersConsumption[opt.value], '=', 1)
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
