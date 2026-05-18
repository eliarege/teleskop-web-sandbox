import { fileTypeFromBuffer } from 'file-type'
import { createFileUploadService } from '~/server/services/fileUpload'
import { dmsDB } from '~/server/connectionPool'
import { isValidPartCountColumn } from '~/server/utils/partCountColumn'

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif']

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length < 1) {
      throw new Error('Invalid form data')
    }
    const nameField = formData.find(f => f.name === 'name')
    if (!nameField) {
      throw new Error('Missing name field')
    }
    const partCountActiveField = formData.find(f => f.name === 'partCountActive')
    const defaultUnitTypeDyeField = formData.find(f => f.name === 'defaultUnitTypeDye')
    const defaultUnitTypeChemField = formData.find(f => f.name === 'defaultUnitTypeChem')
    const partCountColumnField = formData.find(f => f.name === 'partCountColumn')
    const file = formData.find(f => f.name === 'image')

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

    const partCountActive = partCountActiveField?.data.toString() === 'true'
    const defaultUnitTypeDye = Number(defaultUnitTypeDyeField?.data.toString() ?? '0')
    const defaultUnitTypeChem = Number(defaultUnitTypeChemField?.data.toString() ?? '1')
    const rawPartCountColumn = partCountColumnField?.data.toString() ?? ''
    const partCountColumn = rawPartCountColumn && isValidPartCountColumn(rawPartCountColumn)
      ? rawPartCountColumn
      : null

    if (rawPartCountColumn && partCountColumn === null) {
      throw createError({ statusCode: 400, message: 'Invalid partCountColumn value' })
    }

    const res = await dmsDB('COMPANY_INFO')
      .first()
      .update({
        company_name: nameField.data,
        part_count_active: partCountActive,
        default_unit_type_dye: defaultUnitTypeDye,
        default_unit_type_chem: defaultUnitTypeChem,
        part_count_column: partCountColumn,
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
