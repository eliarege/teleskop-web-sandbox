import { WSDL } from 'soap'
import WSDL_CONTENT from '../../wsdl/ns.wsdl'
import { knex } from '~/server/connectionPool'
import soapSchema from '~/utils/soapSchema'

const wsdl = new WSDL(WSDL_CONTENT, '', {})

export default defineEventHandler(async (event) => {
  const { ip } = getQuery(event)

  try {
    const response = await $fetch(`http://${ip}:8080`, {
      method: 'POST',
      body: soapSchema('GetVersion', '<Dummy>0</Dummy>'),
      timeout: 1000,
    })
  } catch (error) {
    throw createError({ statusMessage: 'NETWORK_CONN_FAILED', statusCode: 500 })
  }
})
