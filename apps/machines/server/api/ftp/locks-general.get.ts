import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = await getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const locks = await tbb.fetchLocksGeneral()

    const generalLocks = locks?.map(l => ({
      ...l,
      machineId,
    }))

    await knex('BFLOCKSGENERAL').del()
    await knex('BFLOCKSGENERAL').insert(generalLocks)

    return generalLocks
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
