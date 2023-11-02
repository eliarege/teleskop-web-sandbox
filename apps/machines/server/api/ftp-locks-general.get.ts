import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { fileLockGeneralParser } from '../utils/fileLockGeneralParser'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    await ftpClient.access({
      host: '192.168.88.202',
      user: 'eliar',
      password: 'el1984',
    })
    const sourceFolderPath = './server/data/locks'
    const sourcePath = './server/data/locks/locks_general'
    const remotePath = '../../tbb6500/data/locks/locks_general'

    if (!fs.existsSync(sourceFolderPath)) {
      await fs.promises.mkdir(sourceFolderPath)
    }

    await ftpClient.downloadTo(sourcePath, remotePath)

    const content = await fs.promises.readFile(sourcePath, 'utf8')
    const locks = fileLockGeneralParser(content)

    return locks
  } catch (err) {
    console.log(err)
  }
  ftpClient.close()
})
