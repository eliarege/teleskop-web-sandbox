import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  await dmsDB('FABRIC_TYPE').where('fabric_type_id', id).del()
})

