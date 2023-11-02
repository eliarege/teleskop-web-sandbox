import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { fileUserParser } from '../utils/fileUserParser'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    await ftpClient.access({
      host: '192.168.88.202',
      user: 'eliar',
      password: 'el1984',
    })
    const sourcePath = './server/data/users'
    const remotePath = '../../tbb6500/data/users/users'
    await ftpClient.downloadTo(sourcePath, remotePath)

    const content = await fs.promises.readFile(sourcePath, 'utf8')
    const users = fileUserParser(content)

    return users
  } catch (err) {
    console.log(err)
  }
  ftpClient.close()
})
