import { TonelloApi } from '@teleskop/core'
import { TbbFtpClient } from '@teleskop/tbb-ftp-client'
import * as ping from 'ping'
import { z } from 'zod'
import soapSchema from '~/utils/soapSchema'

const bodySchema = z.object({
  ip: z.string().ip({ version: 'v4' }),
  tbbModel: z.string(),
})

async function runTest(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn()
    return true
  }
  catch {
    return false
  }
}

async function testPing(ip: string): Promise<boolean> {
  return runTest(async () => {
    const res = await ping.promise.probe(ip, { timeout: 5, min_reply: 1 })
    if (!res.alive) throw new Error('Host unreachable')
  })
}

export default defineAuthEventHandler(async (event) => {
  const { ip, tbbModel } = await readValidatedBody(event, bodySchema.parse)

  if (tbbModel === 'Tonello') {
    const [pingResult, apiResult] = await Promise.all([
      testPing(ip),
      runTest(() => TonelloApi.createFromHostname(ip).fetchDatetime()),
    ])

    return {
      results: [
        { id: 'ping', result: pingResult },
        { id: 'api', result: apiResult },
      ],
    }
  }
  else {
    const [pingResult, ftpResult, soapResult] = await Promise.all([
      testPing(ip),
      runTest(async () => {
        const ftpClient = new TbbFtpClient(ip, { timeout: 1000 })
        await ftpClient.connect()
        ftpClient.close()
      }),
      runTest(() =>
        $fetch(`http://${ip}:8080`, {
          method: 'POST',
          body: soapSchema('GetVersion', '<Dummy>0</Dummy>'),
          timeout: 1000,
        }),
      ),
    ])

    return {
      results: [
        { id: 'ping', result: pingResult },
        { id: 'ftp', result: ftpResult },
        { id: 'soap', result: soapResult },
      ],
    }
  }
})
