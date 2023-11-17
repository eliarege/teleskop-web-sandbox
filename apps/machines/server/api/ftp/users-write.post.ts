import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const users = await knex('BFUSERS').select({
      userId: 'userID',
      userName: 'userName',
      userSurname: 'userSurname',
      userPass: 'userPass',
      userInfo: 'userInfo',
      userActive: 'userActive',
      userType: 'userType',
      userMode: 'userMode',
      userMode2: 'userMode2',
    })

    const tbb = new TBB6500FtpClient('192.168.88.202')
    await tbb.writeUsers(users)
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
