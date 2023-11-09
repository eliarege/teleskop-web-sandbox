import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const finishReasons = await tbb.fetchFinishReasons()

    await knex('BFDYLOTFINISHREASONS').del()
    await knex('BFDYLOTFINISHREASONS').insert(finishReasons)

    return finishReasons
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
