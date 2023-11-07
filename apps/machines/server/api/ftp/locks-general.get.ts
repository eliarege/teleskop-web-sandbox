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
    const sourceFolderPath = './server/data/locks'
    const sourcePath = './server/data/locks/locks_general'
    const remotePath = '/tbb6500/data/locks/locks_general'

    if (!fs.existsSync(sourceFolderPath)) {
      await fs.promises.mkdir(sourceFolderPath)
    }

    await ftpClient.downloadTo(sourcePath, remotePath)

    const content = await fs.promises.readFile(sourcePath, 'utf8')
    const locks = fileLockGeneralParser(content)

    const modifiedLocks = locks.map((l) => {
      return {
        MACHINEID: l.machineId,
        LOCKNO: l.lockNo,
        LOCKNAME: l.lockName,
        LOGICTYPE: l.logicType,
        STOPDYEING: l.stopDyeing,
        JUMPSTEP: l.jumpStep,
        ALARM: l.alarm,
        ONDELAY: l.onDelay,
        STEPDELAY: l.stepDelay,
        GIVEMESSAGE: l.giveMessage,
        MESSAGESTRING: l.messageString,
        AINLOGICTYPE: 0,
        DINLOGICTYPE: 0,
        COMMANDLOGICTYPE: 0,
        LOCKLOGICTYPE: 0,
        DOUTLOGICTYPE: 0,
        VINLOGICTYPE: 0,
      }
    })

    await knex('BFLOCKSGENERAL').del()
    await knex('BFLOCKSGENERAL').insert(modifiedLocks)

    return locks
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
