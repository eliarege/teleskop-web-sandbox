import { TbbFtpClient, withTbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { ip } = getQuery(event)
  try {
    const ftpClient = new TbbFtpClient(ip as string, { timeout: 1000 })
    await ftpClient.connect()
    ftpClient.close()
  } catch (e) {
    console.error(e)
    throw createError({ statusMessage: 'MACHINE_CONN_FAILED', statusCode: 500 })
  }
})
