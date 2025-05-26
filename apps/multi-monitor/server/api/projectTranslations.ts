import { knex } from '../knexConfig'

export default defineEventHandler(async (event) => {
  const { locale } = getQuery(event)
  try {
    const res = await knex('BFMACHINETRANSLATIONS')
      .select('messages')
      .where('to_locale', locale)
      .first()

    if (res) {
      return {
        messages: JSON.parse(res.messages),
      }
    }
  } catch (err) {
    console.error(err)
  }
})
