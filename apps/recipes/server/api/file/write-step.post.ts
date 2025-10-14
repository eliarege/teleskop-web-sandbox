import fs from 'node:fs/promises'
import { Mutex } from 'async-mutex'
import SambaClient from 'samba-client'

const config = useRuntimeConfig()
const mutex = new Mutex()

export default defineEventHandler(async (event) => {
  const { content, reqFilePath } = await readBody(event)
  const writeFilePath = 'write'
  const sambaClient = new SambaClient({
    address: config.sambaPath,
    username: config.sambaUser,
    password: config.sambaPassword,
  })
  const contentString = `${content.join(',')},\n`
  await mutex.runExclusive(async () => {
    await sambaClient.getFile(reqFilePath, writeFilePath)
    await fs.appendFile(writeFilePath, contentString, 'utf8')
    await sambaClient.sendFile(writeFilePath, reqFilePath)
  })
})
