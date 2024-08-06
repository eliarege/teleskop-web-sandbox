import { createRouter, useBase } from 'h3'
import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/stepLogs', router.handler)

const selectParameters = {
  id: 'L.ID',
  plankey: 'L.PLANKEY',
  machineid: 'L.MACHINEID',
  machineName: 'M.MACHINENAME',
  joborder: 'L.JOBORDER',
  programIndex: 'L.PROGRAMINDEX',
  programNo: 'L.PROGRAMNO',
  programName: 'P.NAME',
  recipeType: 'L.RECIPETYPE',
  requestIndex: 'L.REQUESTPROGRAMINDEX',
  status: 'L.STATUS',
  time: 'L.EVENTTIME',
  description: 'L.EXPLANATION',

}
router.get('/check-if-log-exists', defineAuthEventHandler(async (event) => {
  const { plankey } = getQuery(event)
  const parameters = await knex('DYBFBATCHORDERRECIPESTEPLOGS as L')
    .where('PLANKEY', Number(plankey))
  return !!parameters.length
}))

router.post('/filtered-logs', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const logs = knex('DYBFBATCHORDERRECIPESTEPLOGS as L')
    .leftJoin('DYTFMACHINES as M', 'L.MACHINEID', 'M.MACHINEID')
    .leftJoin('BFMASTERPRGHEADER as P', function () {
      this
        .on('L.PROGRAMNO', '=', 'P.PROGNO')
        .andOn('M.MACHINEID', '=', 'P.MACHINEID')
    })
    .where('PLANKEY', Number(body.plankey))
    .select(selectParameters)
  filtersToKnex(body.filters, selectParameters, logs)
  return await logs
}))
