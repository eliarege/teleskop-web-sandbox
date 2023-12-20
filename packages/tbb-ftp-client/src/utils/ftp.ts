import * as ftp from 'basic-ftp'
import stream from "stream"

const ftpClient = new ftp.Client()

async function connectClient(host) {
  await ftpClient.access({
    host: host,
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
        chunks.push(data);
        callback();
      }
    });

    writableStream.on('finish', () => {
      content = Buffer.concat(chunks).toString('utf8');
    });

    await ftpClient.downloadTo(writableStream, remotePath)
    return content
  } catch (err) {
    console.error(err)
  } finally {
    ftpClient.close()
  }
}
