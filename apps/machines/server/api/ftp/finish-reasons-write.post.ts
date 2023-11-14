import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const finishReasons = await knex('BFDYLOTFINISHREASONS').select({
      reasonId: 'REASONID',
      typeId: 'TYPEID',
      text: 'TEXT',
      reportToERP: 'ReportToERP',
    })
    console.log('finishReasons = ', finishReasons)

    const tbb = new TBB6500FtpClient('192.168.88.202')
    await tbb.writeFinishReasons(finishReasons)
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
