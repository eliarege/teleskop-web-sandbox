import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const body = await readBody(event)

  for (const [key, value] of Object.entries(body)) {
    let transformedValue = value

    if (key !== '7') {
      transformedValue = value === true || value === '1' ? 1 : 0
    }

    const record = await knex('TFTELESKOPSETTINGS')
      .where('ID', Number.parseInt(key))
      .first()

    if (!record) {
      await knex('TFTELESKOPSETTINGS').insert({
        ID: Number.parseInt(key),
        VALUE: transformedValue,
      })
    } else
      await knex('TFTELESKOPSETTINGS')
        .where('ID', Number.parseInt(key))
        .update({ VALUE: transformedValue })
  }
})
