import { machine } from 'node:os'
import { ElScrollbar } from 'element-plus'
import { createRouter, useBase } from 'h3'
import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/consumption', router.handler)

router.get('/theoretical', defineAuthEventHandler(async (event) => {
  const { joborder, correctionNo } = getQuery(event)

  const query = await knex
    .select({
      processNo: 'B.PROGRAMNO',
      machinename: 'M.MACHINENAME',
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
      machineid: 'B.MACHINEID',
      interval: knex.raw('DATEDIFF(minute, B.REQUESTTIME, B.COMPLETEDTIME)'),
      otoMan: 'B.AUTO',
    },
    )
    .from('DYTFREQMATERIALS as A')
    .join('DYTFCHEMREQUESTS as B', 'A.REQNUMBER', '=', 'B.REQNUMBER')
    .join('DYTFMACHINES as M', 'B.MACHINEID', 'M.MACHINEID')
    .join('DYTFMATERIAL as C', 'A.CHEMCODE', '=', 'C.MATERIALCODE')
    .where('B.BATCHNO', joborder)
    .andWhere('B.BATCHCORRECTIONNO', correctionNo)
    .orderBy(['B.REQUESTTIME', 'A.PARALLELSTEP'])
  return query
}))

router.get('/manual', defineAuthEventHandler(async (event) => {
  const { joborder, correctionNo } = getQuery(event)

  const query = await knex('DYTFDUSTMATERIALSREQ as A')
    .select({
      joborder: 'A.BATCHNO',
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
    .where('A.BATCHNO', joborder)
    .andWhere('A.CORRECTIONNO', correctionNo)
  return query
}))

const selectParametersConsumption = {
  consumptionNo: 'd.CONSUMPTIONNO',
  recordDate: 'd.RECORDDATE',
  amount: 'd.AMOUNT',
  unit: 'd.UNIT',
  isManuel: 'd.ISMANUEL',
  correction: 'd.CORRECTION',
  system: 'd.SYSTEM',
  machineid: 'd.MACHINEID',
  machinecode: 'm.MACHINECODE',
  isTransferred: 'd.ISTRANSFERRED',
  materialCode: 'd.MATERIALCODE',
  joborderCode: 'd.JOBORDERCODE',
  consumptionCode: 'd.CONSUMPTIONCODE',
  cost: 'd.COST',
  water: 'd.WATER',
  recipeAmount: 'd.RECIPEAMOUNT',
  weighingStartTime: 'd.WEIGHINGSTARTTIME',
  programNo: 'd.PROGRAMNO',
  programOrder: 'd.PROGRAMORDER',
  programReqOrder: 'd.PROGRAMREQORDER',
  dispenserId: 'd.DISPENSERID',
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
    .leftJoin('BFMACHINES as m', 'd.MACHINEID', 'm.MACHINEID')
    .where('d.DISPENSERID', '!=', -1)
    // .where('RECORDDATE', '>=', knex.raw('DATEADD(hour, -12, GETDATE())'))
    .orderBy('RECORDDATE', 'desc')

  if (filters && filters.length > 0) {
    filtersToKnex(filters, selectParametersConsumption, dataQuery)
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

router.get('/consumption-count', defineAuthEventHandler(async () => {
  const result = await knex('DYTACONSUMPTION')
    // .where('RECORDDATE', '>=', knex.raw('DATEADD(hour, -12, GETDATE())'))
    .count('* as count')
  return result[0].count
}))
