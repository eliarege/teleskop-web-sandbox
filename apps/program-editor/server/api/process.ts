import { createProcessType, deleteProcessType, fetchProcessTypes, updateProcessType } from '../functions'
import { checkPermission } from '../utils/auth'

export default defineAuthEventHandler(async (event) => {
  if (event.method === 'GET') {
    return await fetchProcessTypes()
  }

  checkPermission(event, 'process-edit')
  const body = await readBody(event)

  if (event.method === 'POST') {
    return createProcessType(body)
  } else if (event.method === 'PUT') {
    return updateProcessType(body)
  } else if (event.method === 'DELETE') {
    return deleteProcessType(body)
  }
})
