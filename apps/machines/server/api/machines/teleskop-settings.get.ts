import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async () => {
  const settings = await knex('TFTELESKOPSETTINGS')
    .select({
      id: 'ID',
      value: 'VALUE',
    },
    )
  return settings
})
