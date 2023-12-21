import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new FTPClient('192.168.88.202')

    const counters = await tbb.fetchCounters()

    await knex('BFMACHCOUNTER').where('MACHINEID', machineId).del()
    await knex('BFMACHCOUNTER').insert(counters?.map(d => ({
      MACHINEID: machineId,
      ID: d.id,
      CARD: d.card,
      CANAL: d.canal,
      NAME: d.name,
      ENABLED: d.enabled,
      ISDELETED: false,
    })))

    return counters
  } catch (err) {
    console.error(err)
  }
})
