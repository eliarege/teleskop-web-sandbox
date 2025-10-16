import { TonelloApi } from '@teleskop/core'
import soapSchema from '~/utils/soapSchema'

export default defineAuthEventHandler(async (event) => {
  const { ip, uuid, tbbModel } = await readBody(event)
  const sse = useSSE()

  try {
    if (tbbModel === 'Tonello') {
      const api = new TonelloApi(`http://${ip}:1234`)
      await api.fetchDatetime()
    } else {
      await $fetch(`http://${ip}:8080`, {
        method: 'POST',
        body: soapSchema('GetVersion', '<Dummy>0</Dummy>'),
        timeout: 1000,
      })
    }
    uuid && sse.send(uuid, 'log', { message: 'connection-successful' })
  } catch (error) {
    uuid && sse.send(uuid, 'error', { message: 'NETWORK_CONN_FAILED' })
    throw createError({
      statusMessage: 'NETWORK_CONN_FAILED',
      statusCode: 500,
    })
  }
})
