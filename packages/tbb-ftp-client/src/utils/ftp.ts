import stream from 'node:stream'
import * as ftp from 'basic-ftp'

const ftpClient = new ftp.Client()

async function connectClient(host) {
  await ftpClient.access({
    host,
    user: 'eliar',
    password: 'el1984',
  })
}
export async function download(remotePath: string, host: string) {
  try {
    await connectClient(host)

    const chunks = []
    let content
    const writableStream = new stream.Writable({
      write(data, encoding, callback) {
        chunks.push(data)
        callback()
      },
    })

    await ftpClient.downloadTo(writableStream, remotePath)
    content = Buffer.concat(chunks).toString('utf8')

    return content
  } finally {
    ftpClient.close()
  }
}

export async function upload(remotePath: string, host: string, content: string) {
  try {
    await connectClient(host)

    const readableStream = new stream.Readable({
      read() {},
    })
    readableStream.push(content)
    readableStream.push(null)

    await ftpClient.uploadFrom(readableStream, remotePath)
  } finally {
    ftpClient.close()
  }
}
