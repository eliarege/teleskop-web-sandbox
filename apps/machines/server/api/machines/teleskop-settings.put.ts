import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  for (const [key, value] of Object.entries(body)) {
    let transformedValue = value

    if (key !== '7') {
      transformedValue = value === true || value === '1' ? 1 : 0
    }

    await knex('TFTELESKOPSETTINGS')
      .where('ID', Number.parseInt(key))
      .update({ VALUE: transformedValue })
  }
})
