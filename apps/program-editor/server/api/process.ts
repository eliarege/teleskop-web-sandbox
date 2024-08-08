import { createProcessType, deleteProcessType, fetchProcessTypes, updateProcessTypes } from '../functions'

export default defineAuthEventHandler(async (event) => {
  if (event.method === 'GET')
    return await fetchProcessTypes()
  else {
    const body = await readBody(event)
    if (event.method === 'POST') {
      return createProcessType(body)
    } else if (event.method === 'PUT') {
      return updateProcessTypes(body)
    } else if (event.method === 'DELETE') {
      return deleteProcessType(body)
    }
  }
})
