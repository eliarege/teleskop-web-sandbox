import type { TbbFtpClientOptions } from './src/TbbFtpClient'
import { TbbFtpClient } from './src/TbbFtpClient'

export { TbbFtpClient }

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
