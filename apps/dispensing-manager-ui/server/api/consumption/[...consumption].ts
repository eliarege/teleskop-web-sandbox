import { machine } from 'node:os'
import { ElScrollbar } from 'element-plus'
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
  isManuel: 'd.ISMANUEL',
  correction: 'd.CORRECTION',
  system: 'd.SYSTEM',
  machineId: 'd.MACHINEID',
  machineCode: 'm.MACHINECODE',
  isTransferred: 'd.ISTRANSFERRED',
  materialCode: 'd.MATERIALCODE',
  jobOrderCode: 'd.JOBORDERCODE',
  consumptionCode: 'd.CONSUMPTIONCODE',
  water: 'd.WATER',
  recipeAmount: 'd.RECIPEAMOUNT',
  programNo: 'd.PROGRAMNO',
  programOrder: 'd.PROGRAMORDER',
  programReqOrder: 'd.PROGRAMREQORDER',
  dispenserId: 'd.DISPENSERID',
  dispenserName: 'disp.MACHINENAME',
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
    .leftJoin('DYTFMACHINES as disp', 'd.DISPENSERID', 'disp.MACHINEID')
    .where('d.DISPENSERID', '!=', -1)
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
