import { WSDL } from 'soap'
import WSDL_CONTENT from '../../wsdl/ns.wsdl'
import soapSchema from '~/utils/soapSchema'

const wsdl = new WSDL(WSDL_CONTENT, '', {})

export default defineAuthEventHandler(async (event) => {
  const { ip } = await readBody(event)

  try {
    const response = await $fetch(`http://${ip}:8080`, {
      method: 'POST',
      body: soapSchema('GetVersion', '<Dummy>0</Dummy>'),
      timeout: 5000,
    })

    const object = wsdl.xmlToObject(response)
    const version = object.Body.VersionResponse.result.String

    return {
      version,
    }
  } catch (error) {
    console.error('Error getting version:', error)
    throw createError({
      statusMessage: 'VERSION_INFO_FAILED',
      statusCode: 500,
    })
  }
})
