import { createProcessType, deleteProcessType, fetchProcessTypes, updateProcessTypes } from '../functions'
import { hasRole } from '~/shared/utils'

export default defineAuthEventHandler(async (event) => {
  if (event.method === 'GET') {
    return await fetchProcessTypes()
  }

  if (!hasRole(event, 'process-edit')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to perform this action.',
    })
  }

  const body = await readBody(event)

  if (event.method === 'POST') {
    return createProcessType(body)
  } else if (event.method === 'PUT') {
    return updateProcessTypes(body)
  } else if (event.method === 'DELETE') {
    return deleteProcessType(body)
  }
})
