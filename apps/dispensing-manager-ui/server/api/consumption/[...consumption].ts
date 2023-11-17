/* eslint-disable ts/no-invalid-this */
import { ElScrollbar } from 'element-plus'
import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/consumption', router.handler)

const selectParameters = {
  processNo: '',
  machinename: 'm.MACHINENAME',
  tankNo: '',
  processIndex: '',
  mainStep: 'MAINSTEP',
  parallelStep: '',
  materialCode: '',
  materialName: '',
  recipeAmount: '',
  actualAmount: '',
  status: '',
  requestTime: '',
  completedTime: '',
  interval: '',
  otoMan: 'c.ISMANUEL',
}

router.get('/theoretical', defineEventHandler(async (event) => {
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

router.get('/manual', defineEventHandler(async (event) => {
  const { joborder, correctionNo } = getQuery(event)

  const query = await knex('DYTFDUSTMATERIALSREQ as A')
    .select({
      joborder: 'A.BATCHNO',
      correctionNo: 'A.CORRECTIONNO',
      weighingNumber: 'B.AMOUNT',
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
