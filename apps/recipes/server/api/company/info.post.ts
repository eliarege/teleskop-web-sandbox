import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    const name = formData[0]
    const file = formData[1]

    if (file) {
      const uploadDir = path.resolve('./public/uploads')
      await mkdir(uploadDir, { recursive: true })

      const filePath = path.join(uploadDir, file.filename)
      await writeFile(filePath, file.data)
    }
    const savedPath = file? `/uploads/${file.filename}` : undefined
    const res = await dmsDB('COMPANY_INFO')
      .first()
      .update({ company_name: name.data, ...(savedPath && { logo_path: savedPath }) })

    return res
  } catch (error) {
    console.error(error.message)
    return { error: error.message }
  }
})
