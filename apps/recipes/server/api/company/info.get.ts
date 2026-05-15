import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const info = await dmsDB('COMPANY_INFO')
      .select({
        name: 'company_name',
        logoPath: 'logo_path',
      })
      .first()

    const logoPath = info.logoPath
      ? `/api/uploads/${info.logoPath}`
      : null

    return { name: info.name, logoPath }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(errMsg)
    return { error: errMsg }
  }
})
