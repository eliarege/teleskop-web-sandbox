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

    const sourceFolderPath = './server/data/users'
    const sourcePath = './server/data/users/users'
    const remotePath = '/tbb6500/data/users/users'

    if (!fs.existsSync(sourceFolderPath)) {
      await fs.promises.mkdir(sourceFolderPath)
    }
    await ftpClient.downloadTo(sourcePath, remotePath)

    const content = await fs.promises.readFile(sourcePath, 'utf8')
    const users = fileUserParser(content)

    await knex('BFUSERS').del()
    await knex('BFUSERS').insert(users)

    return users
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
