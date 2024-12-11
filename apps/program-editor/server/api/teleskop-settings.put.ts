import { updateTeleskopSettings } from '../functions'
import logger from '~/server/logger'

export default defineAuthEventHandler({
  roles: ['teleskop-settings'],
  handler: async (event) => {
    const body = await readBody(event)
    const id = Number(body.id)
    const value = body.value
    logger.info(`User: ${event.context.kauth?.name}. Teleskop settings updated. ID: ${id}. Value: ${value}.`)

    return await updateTeleskopSettings(id, value)
  },
})
