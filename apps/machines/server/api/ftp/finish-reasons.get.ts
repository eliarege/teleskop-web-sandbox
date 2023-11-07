import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

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
    const sourcePath = './server/data/config/bitirmenedenleri'
    const remotePath = '/tbb6500/data/config/bitirmenedenleri'

    if (!fs.existsSync(sourceFolderPath)) {
      await fs.promises.mkdir(sourceFolderPath)
    }

    await ftpClient.downloadTo(sourcePath, remotePath)

    const content = await fs.promises.readFile(sourcePath, 'utf8')
    const finishReasons = fileFinishReasonParser(content)

    await knex('BFDYLOTFINISHREASONS').del()
    await knex('BFDYLOTFINISHREASONS').insert(finishReasons)

    return finishReasons
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
