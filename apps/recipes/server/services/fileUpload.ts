import { createReadStream } from 'node:fs'
import { mkdir, stat, writeFile, unlink } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { basename, isAbsolute, resolve } from 'node:path'

function getResolvedUploadDir(uploadDir: string): string {
  return isAbsolute(uploadDir) ? uploadDir : resolve(process.cwd(), uploadDir)
}

export class FileUploadService {
  private readonly resolvedDir: string

  constructor(uploadDir: string) {
    this.resolvedDir = getResolvedUploadDir(uploadDir)
  }

  private resolvePath(filename: string): string {
    const safeFilename = basename(filename)
    return resolve(this.resolvedDir, safeFilename)
  }

  async saveFile(filename: string, data: Buffer): Promise<string> {
    await mkdir(this.resolvedDir, { recursive: true })
    const filePath = this.resolvePath(filename)
    await writeFile(filePath, data)
    return basename(filename)
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = this.resolvePath(filename)
    try {
      await stat(filePath) // Check if file exists
      await unlink(filePath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }

  readStream(filename: string): ReadableStream<Uint8Array> {
    const filePath = this.resolvePath(filename)
    const nodeStream = createReadStream(filePath)
    return Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>
  }

  async getFileMeta(filename: string): Promise<{ size: number; mtime: Date }> {
    const filePath = this.resolvePath(filename)
    const stats = await stat(filePath)
    return {
      size: stats.size,
      mtime: stats.mtime,
    }
  }
}

export function createFileUploadService(uploadDir: string): FileUploadService {
  return new FileUploadService(uploadDir)
}
