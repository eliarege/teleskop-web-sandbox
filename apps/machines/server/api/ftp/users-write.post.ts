import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
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

    const tbb = new FTPClient('192.168.88.202')
    // await tbb.writeUsers(users)
  } catch (err) {
    console.error(err)
  }
})
