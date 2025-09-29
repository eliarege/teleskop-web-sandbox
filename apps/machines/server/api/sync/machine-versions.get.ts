import { WSDL } from 'soap'
import { inferBoolean } from '@teleskop/utils'
import WSDL_CONTENT from '../../wsdl/ns.wsdl'
import { knex } from '~/server/connectionPool'
import soapSchema from '~/utils/soapSchema'

const wsdl = new WSDL(WSDL_CONTENT, '', {})
const sseLoggingEnabled = inferBoolean(useRuntimeConfig().sseLoggingEnabled)

export default defineAuthEventHandler(async (event) => {
  const { sseId } = getQuery(event)
  const machines = await knex
    .from('BFMACHINES')
    .select('MACHINEID', 'IP')
    .whereNot('TBBMODEL', 'Tonello')

  if (sseLoggingEnabled && !sseId) {
    throw new Error('SSE ID REQUIRED')
  }

  const strSseId = sseId!.toString()
  const sse = useSSE()
  let currentStep = 0
  const totalSteps = machines.length

  for (const machine of machines) {
    const { MACHINEID, IP } = machine
    try {
      const startingMessage = `version-check-started-${MACHINEID}`

      sse.send(strSseId, 'start', { message: startingMessage, progress: Math.round((currentStep / totalSteps) * 100) })

      const response = await $fetch(`http://${IP}:8080`, {
        method: 'POST',
        body: soapSchema('GetVersion', '<Dummy>0</Dummy>'),
        timeout: 1000,
      })

      const object = wsdl.xmlToObject(response)
      const version = object.Body.VersionResponse.result.String

      await knex('BFMACHINES')
        .where('MACHINEID', MACHINEID)
        .update({ VERSION: version })

      const successMessage = `version-check-completed-${MACHINEID}`
      sse.send(strSseId, 'log', { message: successMessage, progress: Math.round(((currentStep + 1) / totalSteps) * 100) })
    } catch (err: any) {
      const errorMessage = `version-check-failed-${MACHINEID}`
      sse.send(strSseId, 'error', { message: errorMessage, progress: Math.round(((currentStep + 1) / totalSteps) * 100) })

      await knex('BFMACHINES')
        .where('MACHINEID', MACHINEID)
        .update({ VERSION: 'Bağlantı Bulunamadı!' })

      console.error(err.message)
    } finally {
      currentStep++
    }
  }
})
