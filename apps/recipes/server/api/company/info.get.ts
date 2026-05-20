import { dmsDB } from '~/server/connectionPool'
import { withBase } from 'ufo'

export default defineEventHandler(async () => {
  try {
    const config = useRuntimeConfig()
    const info = await dmsDB('COMPANY_INFO')
      .select({
        name: 'company_name',
        logoPath: 'logo_path',
        logoSize: 'logo_size',
        showCompanyName: 'show_company_name',
        partCountActive: 'part_count_active',
        defaultUnitTypeDye: 'default_unit_type_dye',
        defaultUnitTypeChem: 'default_unit_type_chem',
        partCountColumn: 'part_count_column',
      })
      .first()

    const logoPath = info.logoPath
      ? withBase(`/api/uploads/${info.logoPath}`, config.app.baseURL)
      : null

    return {
      name: info.name as string,
      logoPath,
      partCountActive: !!info.partCountActive,
      defaultUnitTypeDye: info.defaultUnitTypeDye as number,
      defaultUnitTypeChem: info.defaultUnitTypeChem as number,
      partCountColumn: (info.partCountColumn as string | null) ?? null,
      logoSize: (info.logoSize as number | null) ?? 24,
      showCompanyName: info.showCompanyName == null ? true : !!info.showCompanyName,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(errMsg)
    return { error: errMsg }
  }
})
