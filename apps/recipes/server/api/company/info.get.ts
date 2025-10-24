import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const info = await dmsDB('COMPANY_INFO')
      .select({
        name: 'company_name',
        logoPath: 'logo_path',
      })
      .first()

    const publicUrl = `/uploads/${info.logoPath.split('/').pop()}`
    return { name: info.name, logoPath: publicUrl }
  } catch (error) {
    console.error(error.message)
    return { error: error.message }
  }
})
