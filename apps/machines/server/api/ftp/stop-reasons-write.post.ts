import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const stopReasons = await knex('BFSTOPREASONS').select({
      stopCode: 'STOPCODE',
      stopName: 'STOPNAME',
      reportToERP: 'ReportToERP',
    })

    const tbb = new FTPClient('192.168.88.202')
    await tbb.writeStopReasons(stopReasons)
  } catch (err) {
    console.error(err)
  }
})
