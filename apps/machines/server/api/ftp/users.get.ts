import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const users = await tbb.fetchUsers()

    await knex('BFUSERS').del()
    await knex('BFUSERS').insert(users)

    return users
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
