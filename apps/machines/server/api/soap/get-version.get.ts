import { WSDL } from 'soap'
import WSDL_CONTENT from '../../wsdl/ns.wsdl'
import soapSchema from '~/utils/soapSchema'

const wsdl = new WSDL(WSDL_CONTENT, '', {})

export default defineEventHandler(async () => {
  const response = await $fetch('http://192.168.88.202:8080', {
    method: 'POST',
    body: soapSchema('GetVersion', '<Dummy>0</Dummy>'),
  })

  const object = wsdl.xmlToObject(response)
  return object.Body.VersionResponse.result.String
})
