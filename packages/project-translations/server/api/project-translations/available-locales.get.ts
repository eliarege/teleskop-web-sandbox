import { db } from '../../db'

export default defineAuthEventHandler(async () => {
  const availableLocales = await db
    .from('BFPROJECTLOCALE')
    .whereIn('id', function () {
      this.from('BFPROJECTTRANSLATIONS').distinct('locale_id')
    })
    .select('id', 'code', 'name')
    .orderBy('id')

  return availableLocales as Array<{ id: number, code: string, name: string }>
})
