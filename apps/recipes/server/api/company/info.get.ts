import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const info = await dmsDB('COMPANY_INFO')
      .select({
        name: 'company_name',
        logoPath: 'logo_path',
        partCountActive: 'part_count_active',
        defaultUnitTypeDye: 'default_unit_type_dye',
        defaultUnitTypeChem: 'default_unit_type_chem',
        partCountColumn: 'part_count_column',
      })
      .first()

    const logoPath = info.logoPath
      ? `/api/uploads/${info.logoPath}`
      : null

    return {
      name: info.name as string,
      logoPath,
      partCountActive: !!info.partCountActive,
      defaultUnitTypeDye: info.defaultUnitTypeDye as number,
      defaultUnitTypeChem: info.defaultUnitTypeChem as number,
      partCountColumn: (info.partCountColumn as string | null) ?? null,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(errMsg)
    return { error: errMsg }
  }
})
