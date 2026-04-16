import { updateTeleskopSettings } from '../functions'
import { useLogger } from '~/server/logger'

export default defineAuthEventHandler({
  roles: ['teleskop-settings'],
  handler: async (event) => {
    const log = useLogger(event)
    const body = await readBody(event)
    const id = Number(body.id)
    const value = body.value
    log.info('Teleskop settings updated. ID: %s. Value: %s.', id, value)

    return await updateTeleskopSettings(id, value)
  },
})
