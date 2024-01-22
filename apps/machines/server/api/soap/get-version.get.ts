import { WSDL } from 'soap'
import WSDL_CONTENT from '../../wsdl/ns.wsdl'
import { knex } from '~/server/connectionPool'
import soapSchema from '~/utils/soapSchema'

const wsdl = new WSDL(WSDL_CONTENT, '', {})

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  const ip = await knex('BFMACHINES')
    .select('IP')
    .where('MACHINEID', machineId)
    .first()
    .then(row => row ? row.IP : null)

  const response = await $fetch(`http://${ip}:8080`, {
    method: 'POST',
    body: soapSchema('GetVersion', '<Dummy>0</Dummy>'),
  })

  const object = wsdl.xmlToObject(response)
  return object.Body.VersionResponse.result.String
})
