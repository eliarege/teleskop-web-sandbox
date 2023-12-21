import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new FTPClient('192.168.88.202')

    const counters = await tbb.fetchCounters()

    await knex('BFMACHCOUNTER').del()
    await knex('BFMACHCOUNTER').insert(counters?.map(c => ({
      ...c,
      machineId,
    })))

    return counters
  } catch (err) {
    console.error(err)
  }
})
