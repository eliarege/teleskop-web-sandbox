import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async () => {
  const version = await knex('TFDBVERSION')
    .select('DBVERSION')
    .first()
    .then(row => row?.DBVERSION.toString().trim())

  return version
})
