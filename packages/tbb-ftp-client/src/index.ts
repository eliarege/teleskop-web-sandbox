import type { TbbFtpClientOptions } from './TbbFtpClient'
import { TbbFtpClient } from './TbbFtpClient'

export { TbbFtpClient }

export type * from './types'

export async function withTbbFtpClient(
  host: string,
  callback: (client: TbbFtpClient) => Promise<void> | void,
  options?: TbbFtpClientOptions,
) {
  const client = new TbbFtpClient(host, options)
  try {
    await client.connect()
    await callback(client)
  } finally {
    client.close()
  }
}
