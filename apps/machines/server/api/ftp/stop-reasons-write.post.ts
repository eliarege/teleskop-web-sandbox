import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const stopReasons = await knex('BFSTOPREASONS').select({
      stopCode: 'STOPCODE',
      stopName: 'STOPNAME',
      reportToERP: 'ReportToERP',
    })
    console.log('stopReasons = ', stopReasons)

    const tbb = new TBB6500FtpClient('192.168.88.202')
    await tbb.writeStopReasons(stopReasons)
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
