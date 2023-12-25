import { Readable, Writable } from 'node:stream'
import { Buffer } from 'node:buffer'
import type { AccessOptions } from 'basic-ftp'
import { Client } from 'basic-ftp'

export async function withClient(clientOrOptions: AccessOptions | Client, callback: (client: Client) => any) {
  if (clientOrOptions instanceof Client) {
    await callback(clientOrOptions)
  } else {
    const client = new Client()
    try {
      await client.access(clientOrOptions)
      await callback(client)
    } finally {
      client.close()
    }
  }
}

export async function download(client: Client, remotePath: string) {
  const chunks: Buffer[] = []
  const writableStream = new Writable({
    write(data, _encoding, callback) {
      chunks.push(data)
      callback()
    },
  })

  await client.downloadTo(writableStream, remotePath)

  return Buffer.concat(chunks).toString('utf8')
}

export async function upload(client: Client, remotePath: string, content: string) {
  const readableStream = new Readable({
    read() {
      this.push(content)
      this.push(null)
    },
  })
  await client.uploadFrom(readableStream, remotePath)
}
