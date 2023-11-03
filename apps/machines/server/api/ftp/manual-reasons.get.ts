import fs from 'node:fs'
import * as ftp from 'basic-ftp'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    await ftpClient.access({
      host: '192.168.88.202',
      user: 'eliar',
      password: 'el1984',
    })
    const sourceFolderPath = './server/data/config'
    const sourcePath = './server/data/config/manuelmodnedenleri'
    const remotePath = '../../tbb6500/data/config/manuelmodnedenleri'

    if (!fs.existsSync(sourceFolderPath)) {
      await fs.promises.mkdir(sourceFolderPath)
    }

    await ftpClient.downloadTo(sourcePath, remotePath)

    const content = await fs.promises.readFile(sourcePath, 'utf8')
    const manualReasons = fileStopReasonParser(content)

    return manualReasons
  } catch (err) {
    console.log(err)
  }
  ftpClient.close()
})
