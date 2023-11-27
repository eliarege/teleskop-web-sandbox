import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = await getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

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
  ftpClient.close()
})
