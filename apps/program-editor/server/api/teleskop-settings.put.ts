import { updateTeleskopSettings } from '../functions'

export default defineAuthEventHandler(async (event) => {
  if (event.method === 'PUT') {
    const body = await readBody(event)
    const id = Number(body.id)
    const value = body.value

    return await updateTeleskopSettings(id, value)
  }
})
