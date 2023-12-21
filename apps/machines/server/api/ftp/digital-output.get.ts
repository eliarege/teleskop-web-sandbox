import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new FTPClient('192.168.88.202')

    const outputs = await tbb.fetchDigitalOutputs()

    const digitalOutputs = outputs?.map(d => ({
      MACHINEID: machineId,
      ID: d.id,
      CARD: d.card,
      CANAL: d.canal,
      NAME: d.name,
      ENABLED: d.enabled,
      ISDELETED: false,
      DEFAULTVALUE: d.defaultValue,
    }))

    await knex('BFMACHDOUT').where('MACHINEID', machineId).del()
    await knex('BFMACHDOUT').insert(digitalOutputs)

    return digitalOutputs
  } catch (err) {
    console.error(err)
  }
})
