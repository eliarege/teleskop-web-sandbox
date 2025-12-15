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
    if (uuid) {
      sse.send(uuid, 'log', { message: 'connection-successful' })
    }
  } catch {
    if (uuid) {
      sse.send(uuid, 'log', { message: 'connection-failed' })
    }
    throw createError({
      statusMessage: 'NETWORK_CONN_FAILED',
      statusCode: 500,
    })
  }
})
