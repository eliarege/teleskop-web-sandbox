import { WSDL } from 'soap'
import WSDL_CONTENT from '../../wsdl/ns.wsdl'
import { knex } from '~/server/connectionPool'
import soapSchema from '~/utils/soapSchema'

const wsdl = new WSDL(WSDL_CONTENT, '', {})

export default defineAuthEventHandler(async (event) => {
  const machines = await knex
    .from('BFMACHINES')
    .select({
      id: 'MACHINEID',
      name: 'MACHINECODE',
      hostname: 'IP',
    })
    .whereNot('TBBMODEL', 'Tonello')

  const t = await useTranslation(event)

  const result = await createTaskStream(event, async (ctx) => {
    const totalSteps = machines.length
    let currentStep = 0
    let hasFailedOnce = false
    let hasSucceededOnce = false
    for (const machine of machines) {
      ctx.cancellation.throwIfCancelled()
      try {
        const response = await $fetch(`http://${machine.hostname}:8080`, {
          method: 'POST',
          body: soapSchema('GetVersion', '<Dummy>0</Dummy>'),
          timeout: 1000,
        })
        const object = wsdl.xmlToObject(response)
        const version = object.Body.VersionResponse.result.String

        await knex('BFMACHINES')
          .where('MACHINEID', machine.id)
          .update({ VERSION: version })

        hasSucceededOnce = true
        ctx.logger.info(t(`receiveVersion.completed`, { machine: machine.name }))
      } catch (err: any) {
        hasFailedOnce = true
        ctx.logger.error(t(`receiveVersion.failed`, { machine: machine.name }))
        await knex('BFMACHINES')
          .where('MACHINEID', machine.id)
          .update({ VERSION: 'Bağlantı Bulunamadı!' })
      } finally {
        currentStep++
        ctx.state.progress(Math.floor(currentStep / totalSteps * 100))
      }
    }

    if (!hasSucceededOnce) {
      ctx.state.fail(t('errorReceivingVersionInfo'))
    } else {
      if (hasFailedOnce) {
        ctx.logger.warn(t('receiveVersion.completedWithErrors'))
      }
      ctx.state.complete()
    }
  })

  if (result.kind === 'stream') {
    return result.stream
  } else {
    return result.kind
  }
})
