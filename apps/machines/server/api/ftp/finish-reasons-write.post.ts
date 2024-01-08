import { TbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const finishReasons = await knex('BFDYLOTFINISHREASONS').select({
    reasonId: 'REASONID',
    typeId: 'TYPEID',
    text: 'TEXT',
    reportToERP: 'ReportToERP',
  })

  const tbb = new TbbFtpClient('192.168.88.202')
  // await tbb.writeFinishReasons(finishReasons)
  return finishReasons
})
