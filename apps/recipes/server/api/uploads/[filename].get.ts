import { serveStatic } from 'h3'
import { basename } from 'node:path'
import { createFileUploadService } from '~/server/services/fileUpload'
import { dmsDB } from '~/server/connectionPool'

const BASE_PATH = '/api/uploads/'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  const fileUploadService = createFileUploadService(runtimeConfig.uploadDir)

  return serveStatic(event, {
    indexNames: [],
    getContents: (id) => {
      const filename = basename(id.slice(BASE_PATH.length))
      return fileUploadService.readStream(filename)
    },
    getMeta: async (id) => {
      const filename = basename(id.slice(BASE_PATH.length))
      if (!filename) {
        return
      }
      const info = await dmsDB('COMPANY_INFO')
        .select('logo_mime_type')
        .where('logo_path', filename)
        .first()

      if (!info) {
        return
      }
      try {
        const meta = await fileUploadService.getFileMeta(filename)
        return {
          ...meta,
          type: info.logo_mime_type || 'application/octet-stream',
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return
        }
        throw error
      }
    },
  })
})
