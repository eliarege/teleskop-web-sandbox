import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new FTPClient('192.168.88.202')

    const outputs = await tbb.fetchAnalogOutputs()
    const analogOutputs = outputs?.map(d => ({
      MACHINEID: machineId,
      ID: d.id,
      CARD: d.card,
      CANAL: d.canal,
      NAME: d.name,
      ENABLED: d.enabled,
      DEFAULTVALUE: d.defaultValue,
      ISDELETED: false,
    }))

    await knex('BFMACHAOUT').where('MACHINEID', machineId).del()
    await knex('BFMACHAOUT').insert(analogOutputs)

    return analogOutputs
  } catch (err) {
    console.error(err)
  }
})
