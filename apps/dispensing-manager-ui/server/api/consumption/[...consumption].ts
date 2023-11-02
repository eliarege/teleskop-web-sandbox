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
  mainStep: '',
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

// TODO: Body type will be added
router.post('/theoretical', defineEventHandler(async (event) => {
  const { joborder } = getQuery(event)
  const consumptions = await knex('DYTACONSUMPTION as c')
    .join('DYTFMACHINES as m', 'c.MACHINEID', 'm.MACHINEID')
    .where('JOBRODERCODE', joborder)
  return consumptions
}))
