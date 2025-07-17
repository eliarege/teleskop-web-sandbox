import { WSDL } from 'soap'
import WSDL_CONTENT from '../../wsdl/ns.wsdl'
import soapSchema from '~/utils/soapSchema'

const wsdl = new WSDL(WSDL_CONTENT, '', {})

export default defineAuthEventHandler(async (event) => {
  const { ip, uuid } = await readBody(event)
  const sse = useSSE()

  try {
    await $fetch(`http://${ip}:8080`, {
      method: 'POST',
      body: soapSchema('GetVersion', '<Dummy>0</Dummy>'),
      timeout: 1000,
    })

    sse.send(uuid, 'log', { message: 'connection-successful' })
  } catch (error) {
    sse.send(uuid, 'error', { message: 'NETWORK_CONN_FAILED' })
    throw createError({
      statusMessage: 'NETWORK_CONN_FAILED',
      statusCode: 500,
    })
  }
})
