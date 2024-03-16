import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const version = await knex('TFDBVERSION')
    .select('DBVERSION')
    .first()
    .then(row => row?.DBVERSION.toString().trim())

  return version
})
