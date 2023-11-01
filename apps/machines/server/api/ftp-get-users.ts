import fs from 'node:fs'
import * as ftp from 'basic-ftp'

export default defineEventHandler(async () => {
  const client = new ftp.Client()
  client.ftp.verbose = true
  try {
    await client.access({
      host: '192.168.88.202',
      user: 'eliar',
      password: 'el1984',
      secure: false,
      port: 21,
    })

    client.trackProgress((info) => {
      console.log('File', info.name)
      console.log('Type', info.type)
      console.log('Transferred', info.bytes)
      console.log('Transferred Overall', info.bytesOverall)
    })

    // await client.downloadToDir('./server/data', '../../tbb6500/data/users/')
    // await client.downloadTo('./server/data/users', '../../tbb6500/data/users/users')

    const content = await fs.promises.readFile('./server/data/users', 'utf8')
    const rows = content.split('\n')
    const users = []

    for (const row of rows) {
      const rowValues = row.trim().split(' ')

      if (rowValues.length === 7) {
        const [userId, userName, userSurname, userPass, userInfo, userActive, userType] = rowValues

        const user = {
          userId,
          userName,
          userSurname,
          userPass,
          userInfo,
          userActive,
          userType,
        }
        users.push(user)
        // addUser(user)
      }
    }
    return users
  } catch (err) {
    console.log(err)
  }
  client.close()
})
