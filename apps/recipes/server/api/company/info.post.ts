import { fileTypeFromBuffer } from 'file-type'
import { createFileUploadService } from '~/server/services/fileUpload'
import { dmsDB } from '~/server/connectionPool'

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif']

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length < 2) {
      throw new Error('Invalid form data')
    }
    const name = formData[0]
    const file = formData[1]

    const runtimeConfig = useRuntimeConfig()
    const fileUploadService = createFileUploadService(runtimeConfig.uploadDir)

    let savedPath: string | undefined
    let logoType: string | undefined


    if (file) {
      const fileName = file.filename || `logo_${Date.now()}`
      const fileType = await fileTypeFromBuffer(file.data)
      if (fileType && allowedMimeTypes.includes(fileType.mime)) {
        logoType = fileType.mime
      } else {
        throw new Error('Invalid file type')
      }

      // If there's an existing logo, delete it before saving the new one
      const prevCompanyInfo = await dmsDB('COMPANY_INFO').first('logo_path')
      if (prevCompanyInfo?.logo_path) {
        await fileUploadService.deleteFile(prevCompanyInfo.logo_path)
      }
      savedPath = await fileUploadService.saveFile(fileName, file.data)
    }

    const res = await dmsDB('COMPANY_INFO')
      .first()
      .update({
        company_name: name.data,
        ...(savedPath && { logo_path: savedPath }),
        ...(logoType && { logo_mime_type: logoType }),
      })

    return res
  }
  catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(errMsg)
    return { error: errMsg }
  }
})
