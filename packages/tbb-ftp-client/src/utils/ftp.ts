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

export interface DownloadOptionsBase {
  emptyWhenNotFound?: boolean
}

export interface DownloadOptionsWithEncoding extends DownloadOptionsBase {
  encoding: BufferEncoding
}
export interface DownloadOptionsWithoutEncoding extends DownloadOptionsBase {
  encoding?: null | undefined
}

export type DownloadOptions = DownloadOptionsWithEncoding | DownloadOptionsWithoutEncoding

export async function download(client: Client, remotePath: string, options?: DownloadOptionsWithoutEncoding): Promise<Buffer>
export async function download(client: Client, remotePath: string, options: DownloadOptionsWithEncoding | BufferEncoding): Promise<string>
export async function download(client: Client, remotePath: string, options?: DownloadOptions | BufferEncoding): Promise<string | Buffer>
export async function download(client: Client, remotePath: string, options?: DownloadOptions | BufferEncoding): Promise<string | Buffer> {
  const chunks: Buffer[] = []
  const writableStream = new Writable({
    write(data, _encoding, callback) {
      chunks.push(data)
      callback()
    },
  })
  options = typeof options === 'string' ? { encoding: options } : options || {}

  await client.downloadTo(writableStream, remotePath).catch((error) => {
    if (options.emptyWhenNotFound && error.code === 550) {
      chunks.push(Buffer.alloc(0))
    } else {
      throw error
    }
  })

  const output = Buffer.concat(chunks)
  return options.encoding
    ? output.toString(options.encoding)
    : output
}

export async function upload(client: Client, remotePath: string, content: string | Buffer | Uint8Array): Promise<void> {
  const readableStream = new Readable({
    read() {
      this.push(content)
      this.push(null)
    },
  })
  await client.uploadFrom(readableStream, remotePath)
}
