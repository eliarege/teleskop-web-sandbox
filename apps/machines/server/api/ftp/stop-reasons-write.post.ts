import { TbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const stopReasons = await knex('BFSTOPREASONS').select({
    stopCode: 'STOPCODE',
    stopName: 'STOPNAME',
    reportToERP: 'ReportToERP',
  })

  const tbb = new TbbFtpClient('192.168.88.202')
  await tbb.writeStopReasons(stopReasons)
})
