import { WSDL } from 'soap'
import WSDL_CONTENT from '../../wsdl/ns.wsdl'
import { knex } from '~/server/connectionPool'
import soapSchema from '~/utils/soapSchema'

const wsdl = new WSDL(WSDL_CONTENT, '', {})

export default defineEventHandler(async () => {
  const machines = await knex('BFMACHINES').select('MACHINEID', 'IP')

  const versionPromises = machines.map(async (machine) => {
    const { MACHINEID, IP } = machine
    try {
      const response = await $fetch(`http://${IP}:8080`, {
        method: 'POST',
        body: soapSchema('GetVersion', '<Dummy>0</Dummy>'),
      })

      const object = wsdl.xmlToObject(response)
      const version = object.Body.VersionResponse.result.String

      await knex('BFMACHINES')
        .where('MACHINEID', MACHINEID)
        .update({ VERSION: version })
    } catch (error) {
      await knex('BFMACHINES')
        .where('MACHINEID', MACHINEID)
        .update({ VERSION: 'Bağlantı Bulunamadı!' })
    }
  })

  await Promise.all(versionPromises)
})
