import { TonelloApi } from '@teleskop/core'
import { TbbFtpClient } from '@teleskop/tbb-ftp-client'
import { z } from 'zod'

const querySchema = z.object({
  ip: z.string().ip({ version: 'v4' }),
  model: z.string().optional(),
})

export default defineAuthEventHandler(async (event) => {
  const query = getQuery(event)
  const { ip, model } = querySchema.parse(query)
  try {
    if (model === 'Tonello') {
      const api = new TonelloApi(`http://${ip}:1234`)
      await api.fetchDatetime()
      return { status: 'ok' }
    } else {
      const ftpClient = new TbbFtpClient(ip as string, { timeout: 1000 })
      await ftpClient.connect()
      ftpClient.close()
      return { status: 'ok' }
    }
  } catch (e) {
    console.error(e)
    throw createError({ statusMessage: 'MACHINE_CONN_FAILED', statusCode: 500 })
  }
})
